/**
 * POST /api/upload?name=song.mp3
 *
 * Streams a raw request body (the file bytes) straight into /bloud. Used by the
 * “add a song from this device” button. Vercel caps request bodies at ~4.5 MB
 * on Hobby, so larger files should go through the Dropbox app.
 */

import { upload } from '../lib/dbx.js';
import { requireAuth } from '../lib/auth.js';
import { getFolder } from '../lib/settings.js';

export const config = {
  maxDuration: 60,
  api: { bodyParser: false },
};

async function readBody(req, limit = 4.4 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const e = new Error('File is larger than 4.4 MB — upload it in the Dropbox app');
      e.status = 413;
      throw e;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  const rawName = (req.query.name || '').toString();
  const name = rawName.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '').trim();
  if (!name) {
    res.status(400).json({ ok: false, error: 'name query param required' });
    return;
  }
  try {
    const folder = await getFolder();
    const body = await readBody(req);
    if (!body.length) {
      res.status(400).json({ ok: false, error: 'empty file' });
      return;
    }
    const path = `${folder.replace(/\/$/, '')}/${name}`;
    const meta = await upload(path, body, 'add');
    res.status(200).json({ ok: true, path: meta?.path_display || path, size: meta?.size || body.length });
  } catch (e) {
    res.status(e.status || 500).json({ ok: false, error: e.message || 'upload_failed' });
  }
}
