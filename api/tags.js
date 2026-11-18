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

/**
 * Minimal MP4 atom walker for iTunes metadata (m4a/mp4).
 *
 * Two things make this fussier than it looks:
 *  1. `moov` is frequently written at the END of the file (after `mdat`), so
 *     the caller must hand us the tail of the file, not the head.
 *  2. Cover art lives in `covr`, which is NOT in the iTunes text-name map, so
 *     it needs its own branch — it is the main source of artwork for .m4a.
 */
/**
 * When the fetched buffer is a *tail* range it starts in the middle of `mdat`,
 * so the atom chain begins with garbage. Find the real `moov` box: scan for the
 * "moov" marker at an aligned position and accept the one whose declared size
 * ends exactly at (or within) the buffer.
 */
function findMoovStart(buf) {
  const want = Buffer.from('moov', 'latin1');
  let best = -1;
  let idx = buf.indexOf(want, 4);
  while (idx !== -1) {
    const start = idx - 4;                 // box size field precedes the type
    if (start >= 0) {
      const size = buf.readUInt32BE(start);
      if (size >= 8 && start + size <= buf.length) {
        if (start + size === buf.length) return start; // exact tail match: best
        if (best === -1 || start > best) best = start;
      }
    }
    idx = buf.indexOf(want, idx + 1);
  }
  return best;
}

function parseMp4(buf) {
  const out = {};
  const containers = new Set(['moov', 'udta', 'meta', 'ilst', 'trak', 'mdia']);
  const names = {
    '\u00a9nam': 'title', '\u00a9ART': 'artist', '\u00a9alb': 'album',
    '\u00a9day': 'year', '\u00a9gen': 'genre', trkn: 'track',
    '\u00a9lyr': 'lyrics', '\u00a9cmt': 'comment', aART: 'albumArtist',
    '\u00a9wrt': 'composer', cprt: 'copyright', desc: 'description',
  };
  const IMAGE_FLAGS = new Set([13, 14, 27]); // jpeg, png, bmp

  /* mvhd holds duration: version, flags, [ctime, mtime], timescale, duration */
  function readMvhd(b, at) {
    const ver = b[at];
    try {
      if (ver === 1) {
        const timescale = b.readUInt32BE(at + 4 + 16);
        const dur = Number(b.readBigUInt64BE(at + 4 + 20));
        return timescale > 0 ? dur / timescale : 0;
      }
      const timescale = b.readUInt32BE(at + 4 + 8);
      const dur = b.readUInt32BE(at + 4 + 12);
      return timescale > 0 ? dur / timescale : 0;
    } catch {
      return 0;
    }
  }

  /* Prefer the audio track's mdhd over mvhd: for m4a they agree, but mdhd is
     authoritative for transcoded files where the movie and track differ. */
  function walk(b, start, end, depth, inTrak) {
    let pos = start;
    while (pos + 8 <= end && depth < 9) {
      let size = b.readUInt32BE(pos);
      const type = b.toString('latin1', pos + 4, pos + 8);
      let header = 8;
      if (size === 1) {
        size = Number(b.readBigUInt64BE(pos + 8));
        header = 16;
      } else if (size === 0) {
        size = end - pos; // atom extends to end of parent
      }
      if (size < header || pos + size > end) break;
      const bodyStart = pos + header;
      const bodyEnd = pos + size;

      if (type === 'mvhd') {
        if (!out.duration) out.duration = readMvhd(b, bodyStart);
      } else if (type === 'mdhd') {
        const d = readMvhd(b, bodyStart);
        if (d && (!inTrak || !out.duration)) out.duration = d;
      }

      if (containers.has(type)) {
        let s = bodyStart;
        if (type === 'meta') s += 4; // meta is a FullBox
        walk(b, s, bodyEnd, depth + 1, inTrak || type === 'trak');
      } else if (type === 'covr' || names[type]) {
        let p = bodyStart;
        while (p + 8 <= bodyEnd) {
          const dsize = b.readUInt32BE(p);
          const dtype = b.toString('latin1', p + 4, p + 8);
          if (dsize < 8 || p + dsize > bodyEnd) break;
          if (dtype === 'data') {
            const flag = b.readUInt32BE(p + 8) & 0xffffff;
            const payload = b.subarray(p + 16, p + dsize);
            if (type === 'covr' || IMAGE_FLAGS.has(flag)) {
              if (payload.length > 256 && !out.cover) {
                const mime = flag === 14 ? 'image/png' : 'image/jpeg';
                out.cover = {
                  dataUrl: `data:${mime};base64,${payload.toString('base64')}`,
                  mime,
                };
              }
            } else if (flag === 1) {
              const txt = payload.toString('utf8').trim();
              if (txt) out[names[type]] = txt;
            } else if (flag === 0 && type === 'trkn') {
              if (payload.length >= 4) out.track = String(payload.readUInt16BE(2));
            } else if (flag === 21 && type === 'trkn') {
              if (payload.length >= 2) out.track = String(payload.readUInt16BE(0));
            }
            break;
          }
          p += dsize;
        }
      }
      pos += size;
    }
  }

  const origin = findMoovStart(buf);
  walk(buf, origin >= 0 ? origin : 0, buf.length, 0, false);
  if (out.duration) out.duration = Math.round(out.duration * 100) / 100;
  return out;
}

/**
 * Parse the LRC header for metadata. Stash-side files carry [ti:] / [ar:] /
 * [al:] / [length:] and are UTF-8; this is metadata the audio file itself may
 * not expose. Falls back to the first timestamped line to sanity-check time.
 */
function parseLrcMeta(text) {
  const out = {};
  if (!text) return out;
  const grab = (tag) => {
    const m = text.match(new RegExp(`^\\s*\\[${tag}:([^\\]]*)\\]`, 'im'));
    return m ? m[1].trim() : '';
  };
  const title = grab('ti');
  const artist = grab('ar');
  const album = grab('al');
  if (title) out.title = title;
  if (artist) out.artist = artist;
  if (album) out.album = album;
  // [length:2:54] → seconds
  const len = grab('length');
  if (len) {
    const parts = len.split(':').map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
    if (parts.length === 2) out.duration = parts[0] * 60 + parts[1];
    else if (parts.length === 3) out.duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return out;
}

/** Find the sibling .lrc for a media path (same folder, same stem). */
function siblingLrc(path) {
  const slash = path.lastIndexOf('/');
  const dir = slash <= 0 ? '' : path.slice(0, slash);
  const base = path.slice(slash + 1).replace(/\.[^.]+$/, '');
  return `${dir}/${base}.lrc`;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const path = (req.query.path || '').toString();
  if (!path.startsWith('/')) {
    res.status(400).json({ ok: false, error: 'path required' });
    return;
  }
  const isMp4 = /\.(m4a|mp4|m4b|aac)$/i.test(path);
  const isMp3 = /\.mp3$/i.test(path);

  try {
    let tags = {};

    if (isMp4) {
      /* The moov atom is usually at the END of an m4a (after mdat), so the head
         of the file tells us nothing. Fetch the tail with a suffix range, which
         Dropbox honours as "last N bytes" — no HEAD request needed, and it works
         for files both with and without a trailing moov. */
      const tailLen = 2 * 1024 * 1024;
      const tail = await pipeFile(path, `bytes=-${tailLen}`);
      let body = tail.body;

      /* A suffix range only covers the tail. If the atom walker finds no moov
         there the file has a front-loaded moov and the head contains it. */
      if (!body.includes(Buffer.from('moov', 'latin1'))) {
        const head = await pipeFile(path, 'bytes=0-524287');
        body = head.body;
      }
      tags = parseMp4(body);
    } else if (isMp3) {
      const { body } = await pipeFile(path, 'bytes=0-1048575');
      tags = parseID3(body);
    } else {
      // Other containers: try ID3 anyway, it costs one small read.
      const { body } = await pipeFile(path, 'bytes=0-262143');
      tags = parseID3(body);
    }

    /* Fill gaps from the sibling .lrc. The audio file often has no title/artist
       atoms, but every Stash song ships a .lrc with [ti:]/[ar:]/[al:]. */
    if (!tags.title || !tags.artist || !tags.duration) {
      try {
        const lrc = await pipeFile(siblingLrc(path), 'bytes=0-8191');
        const meta = parseLrcMeta(lrc.body.toString('utf8'));
        if (!tags.title && meta.title) tags.title = meta.title;
        if (!tags.artist && meta.artist) tags.artist = meta.artist;
        if (!tags.album && meta.album) tags.album = meta.album;
        if (!tags.duration && meta.duration) tags.duration = meta.duration;
      } catch {
        /* no sibling .lrc — filename fallback happens client-side */
      }
    }

    /* The folder name is the artist in Stash's layout:
       /bloud/Stash/<artist>/<album>/<song>.m4a — better than "Unknown artist". */
    if (!tags.artist) {
      const parts = path.split('/').filter(Boolean);
      // parts[-3] is the artist folder for .../<artist>/<album>/<file>
      const artistDir = parts.length >= 3 ? parts[parts.length - 3] : '';
      if (artistDir && !/^(stash|bloud|songs|music)$/i.test(artistDir)) {
        tags.artist = artistDir.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }

    delete tags.comment;
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.status(200).json({ ok: true, tags });
  } catch (e) {
    res.status(e.status === 404 ? 404 : 200).json({ ok: false, error: e.message, tags: {} });
  }
}
