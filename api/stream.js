/**
 * GET /api/stream?path=/bloud/song.mp3
 *
 * 302s to a playable URL for the audio/video/image. The client calls this each
 * time it starts a track, so an expired Dropbox link is never reused.
 */

import { requireAuth } from '../lib/auth.js';
import { resolveMediaUrl } from '../lib/media.js';

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const path = (req.query.path || '').toString();
  if (!path.startsWith('/')) {
    res.status(400).json({ ok: false, error: 'path must be absolute' });
    return;
  }
  if (path.toLowerCase().includes('.bloud_db')) {
    res.status(403).json({ ok: false, error: 'not a media path' });
    return;
  }
  const kind =
    (req.query.kind || '').toString() === 'image'
      ? 'image'
      : /\.(jpe?g|png|webp|gif)$/i.test(path)
        ? 'image'
        : 'audio';

  try {
    const { url, source } = await resolveMediaUrl(path, { kind });
    if (!url) throw new Error('no_url');
    // Long-lived CDN URLs can be cached briefly; Dropbox temp links must not be.
    res.setHeader(
      'Cache-Control',
      source === 'blob' ? 'public, max-age=86400' : 'no-store',
    );
    res.setHeader('X-Bloud-Source', source);
    res.redirect(302, url);
  } catch (e) {
    const status = e.status === 404 ? 404 : e.status === 401 ? 401 : 502;
    res.status(status).json({ ok: false, error: e.message || 'stream_failed' });
  }
}
