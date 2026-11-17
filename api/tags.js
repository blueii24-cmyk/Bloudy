/**
 * GET /api/tags?path=/bloud/song.mp3
 *
 * Fetches just the ID3v2 head of a file (and the MP4 `moov`/`udta` atoms) and
 * returns normalised metadata: title, artist, album, track no., duration,
 * embedded cover art and unsynced lyrics.
 *
 * Works for mp3 (ID3v2.2/2.3/2.4) and m4a/mp4 (iTunes atoms). Other formats
 * fall back to the filename — the client handles that.
 */

import { requireAuth } from '../lib/auth.js';
import { pipeFile } from '../lib/media.js';

export const config = { maxDuration: 30 };

const ID3_TEXT = new Set([
  'TIT2', 'TT2', 'TPE1', 'TP1', 'TALB', 'TAL', 'TRCK', 'TRK',
  'TPE2', 'TP2', 'TCON', 'TCO', 'TDRC', 'TYER', 'TYE', 'TPOS',
]);

function decodeText(bytes) {
  if (!bytes || bytes.length < 1) return '';
  const enc = bytes[0];
  const data = bytes.subarray(1);
  try {
    let out;
    if (enc === 1 || enc === 2) {
      const le = data[0] === 0xff && data[1] === 0xfe;
      const be = data[0] === 0xfe && data[1] === 0xff;
      const body = le || be ? data.subarray(2) : data;
      out = new TextDecoder(le ? 'utf-16le' : 'utf-16be').decode(body);
    } else if (enc === 3) {
      out = new TextDecoder('utf-8').decode(data);
    } else {
      out = new TextDecoder('iso-8859-1').decode(data);
    }
    return out.replace(/\0+$/g, '').replace(/\u0000/g, '').trim();
  } catch {
    return '';
  }
}

function syncSafe(buf, off) {
  return (
    ((buf[off] & 0x7f) << 21) |
    ((buf[off + 1] & 0x7f) << 14) |
    ((buf[off + 2] & 0x7f) << 7) |
    (buf[off + 3] & 0x7f)
  );
}

function parseID3(buf) {
  const out = {};
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) {
    return out;
  }
  const ver = buf[3];
  const flags = buf[5];
  const tagSize = syncSafe(buf, 6);
  let pos = 10;
  if (flags & 0x40) {
    // extended header
    if (ver === 4) pos += syncSafe(buf, 10);
    else pos += 4 + ((buf[10] << 24) | (buf[11] << 16) | (buf[12] << 8) | buf[13]);
  }
  const end = Math.min(buf.length, 10 + tagSize);
  const idLen = ver === 2 ? 3 : 4;
  const headLen = ver === 2 ? 6 : 10;

  while (pos + headLen <= end) {
    const id = buf.toString('latin1', pos, pos + idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    let size;
    if (ver === 2) {
      size = (buf[pos + 3] << 16) | (buf[pos + 4] << 8) | buf[pos + 5];
    } else if (ver === 4) {
      size = syncSafe(buf, pos + 4);
    } else {
      size = (buf[pos + 4] << 24) | (buf[pos + 5] << 16) | (buf[pos + 6] << 8) | buf[pos + 7];
    }
    if (size <= 0 || pos + headLen + size > end + 8192) break;
    const body = buf.subarray(pos + headLen, Math.min(buf.length, pos + headLen + size));

    const map = {
      TIT2: 'title', TT2: 'title',
      TPE1: 'artist', TP1: 'artist',
      TALB: 'album', TAL: 'album',
      TRCK: 'track', TRK: 'track',
      TPE2: 'albumArtist', TP2: 'albumArtist',
      TCON: 'genre', TCO: 'genre',
      TDRC: 'year', TYER: 'year', TYE: 'year',
    };
    if (map[id]) {
      const v = decodeText(body);
      if (v) out[map[id]] = v;
    } else if (id === 'USLT' || id === 'ULT') {
      // enc, lang(3), descriptor\0, lyrics
      let p = 4;
      while (p < body.length && body[p] !== 0) p++;
      const txt = decodeText(
        Buffer.concat([Buffer.from([body[0]]), body.subarray(p + 1)]),
      );
      if (txt) out.lyrics = txt;
    } else if (id === 'APIC' || id === 'PIC') {
      let p = 1;
      let mime = '';
      if (id === 'APIC') {
        const start = p;
        while (p < body.length && body[p] !== 0) p++;
        mime = body.toString('latin1', start, p) || 'image/jpeg';
        p++;
      } else {
        mime = 'image/jpeg';
        p += 3;
      }
      const picType = body[p];
      p++;
      while (p < body.length && body[p] !== 0) p++;
      p++;
      const img = body.subarray(p);
      if (img.length > 256) {
        out.cover = {
          dataUrl: `data:${mime};base64,${img.toString('base64')}`,
          mime,
        };
      }
    }
    pos += headLen + size;
  }
  return out;
}

/** Minimal MP4 atom walker for iTunes metadata (m4a/mp4). */
function parseMp4(buf) {
  const out = {};
  const containers = new Set(['moov', 'udta', 'meta', 'ilst', 'trak', 'mdia']);
  const names = {
    '\u00a9nam': 'title', '\u00a9ART': 'artist', '\u00a9alb': 'album',
    '\u00a9day': 'year', '\u00a9gen': 'genre', trkn: 'track',
    '\u00a9lyr': 'lyrics', '\u00a9cmt': 'comment',
  };

  function walk(buf, start, end, depth) {
    let pos = start;
    while (pos + 8 <= end && depth < 8) {
      let size = buf.readUInt32BE(pos);
      const type = buf.toString('latin1', pos + 4, pos + 8);
      let header = 8;
      if (size === 1) {
        size = Number(buf.readBigUInt64BE(pos + 8));
        header = 16;
      }
      if (size < header || pos + size > end) break;
      const bodyStart = pos + header;
      const bodyEnd = pos + size;
      if (containers.has(type)) {
        let s = bodyStart;
        if (type === 'meta') s += 4;
        walk(buf, s, bodyEnd, depth + 1);
      } else if (names[type] && depth >= 3) {
        // data atom inside ilst item
        let p = bodyStart;
        while (p + 8 <= bodyEnd) {
          const dsize = buf.readUInt32BE(p);
          const dtype = buf.toString('latin1', p + 4, p + 8);
          if (dsize < 8) break;
          if (dtype === 'data') {
            const flag = buf.readUInt32BE(p + 8) & 0xffffff;
            const payload = buf.subarray(p + 16, p + dsize);
            if (flag === 1) {
              out[names[type]] = payload.toString('utf8').trim();
            } else if (flag === 0 && names[type] === 'track') {
              out.track = String(payload.readUInt16BE(2));
            } else if (flag === 13 || flag === 14) {
              out.cover = {
                dataUrl: `data:image/jpeg;base64,${payload.toString('base64')}`,
                mime: 'image/jpeg',
              };
            }
            break;
          }
          p += dsize;
        }
      }
      pos += size;
    }
  }

  walk(buf, 0, buf.length, 0);
  return out;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const path = (req.query.path || '').toString();
  if (!path.startsWith('/')) {
    res.status(400).json({ ok: false, error: 'path required' });
    return;
  }
  const isMp4 = /\.(m4a|mp4|m4b|aac)$/i.test(path);
  try {
    const { body } = await pipeFile(path, isMp4 ? 'bytes=0-262143' : 'bytes=0-131071');
    const tags = isMp4 ? parseMp4(body) : parseID3(body);
    delete tags.comment;
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.status(200).json({ ok: true, tags });
  } catch (e) {
    res.status(e.status === 404 ? 404 : 200).json({ ok: false, error: e.message, tags: {} });
  }
}
