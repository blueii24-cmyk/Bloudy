/**
 * Media URL helpers.
 *
 * Default behaviour: hand the browser a short-lived Dropbox temporary link
 * (they last ~4h and support HTTP Range, so seeking works). The client caches
 * them and refreshes on failure.
 *
 * If BLOB_READ_WRITE_TOKEN is set (and BLOUD_CACHE_MEDIA=1 for audio), files
 * are mirrored into Vercel Blob once and later requests get a stable CDN URL —
 * much faster for repeat plays. Artwork is always mirrored when Blob exists
 * because the files are tiny.
 */

import { tempLink, download, pathKey } from './dbx.js';

/** @vercel/blob is optional: imported lazily so a missing dependency never
 *  takes the whole player down (it just falls back to Dropbox links). */
let blobSdk = null;
async function loadBlobSdk() {
  if (blobSdk !== null) return blobSdk;
  try {
    blobSdk = await import('@vercel/blob');
  } catch {
    blobSdk = false;
  }
  return blobSdk;
}

export const blobEnabled = Boolean(
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOUD_BLOB_TOKEN,
);
const blobToken =
  process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOUD_BLOB_TOKEN || undefined;
const cacheAudio = process.env.BLOUD_CACHE_MEDIA === '1';

const MIME = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/opus',
  flac: 'audio/flac',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  lrc: 'text/plain',
  txt: 'text/plain',
  json: 'application/json',
};

export function mimeFor(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

function blobName(path) {
  const clean = path.replace(/^\/+/, '').replace(/[^\w.\-/]/g, '_');
  return `bloud-media/${pathKey(path)}-${clean.split('/').pop()}`;
}

async function mirrorToBlob(path, contentType) {
  if (!blobEnabled) return null;
  const sdk = await loadBlobSdk();
  if (!sdk) return null;
  const { put, head } = sdk;
  const name = blobName(path);
  try {
    const existing = await head(name, { token: blobToken });
    if (existing && existing.url) return existing.url;
  } catch {
    /* not cached yet */
  }
  const res = await download(path);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const uploaded = await put(name, buf, {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    token: blobToken,
  });
  return uploaded.url;
}

/**
 * Resolve a playable URL for a Dropbox path.
 * @param {string} path
 * @param {{kind?: 'audio'|'image'}} opts
 */
export async function resolveMediaUrl(path, { kind = 'audio' } = {}) {
  const type = mimeFor(path);
  const wantCache = blobEnabled && (kind === 'image' || cacheAudio);
  if (wantCache) {
    try {
      const url = await mirrorToBlob(path, type);
      if (url) return { url, source: 'blob' };
    } catch {
      /* fall through to temp link */
    }
  }
  const link = await tempLink(path);
  return { url: link, source: 'dropbox' };
}

/** Pipe raw bytes (used for ID3 tag sniffing / small text files). */
export async function pipeFile(path, rangeHeader) {
  const res = await download(path, { range: rangeHeader });
  if (!res.ok && res.status !== 206) {
    const e = new Error(`file_unavailable_${res.status}`);
    e.status = res.status === 404 ? 404 : 502;
    throw e;
  }
  return {
    body: Buffer.from(await res.arrayBuffer()),
    status: res.status,
    contentType: mimeFor(path),
    contentRange: res.headers.get('content-range') || '',
  };
}
