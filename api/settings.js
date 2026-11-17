/**
 * GET  /api/settings → current library folder + non-secret state
 * POST /api/settings → { folder } change where the library lives
 */

import { saveSettings, getFolder } from '../lib/settings.js';
import { requireAuth } from '../lib/auth.js';
import { rpc, isConnected } from '../lib/dbx.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, folder: await getFolder() });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const raw = (req.body?.folder || '').toString().trim();
  if (!raw) {
    res.status(400).json({ ok: false, error: 'folder required' });
    return;
  }
  const folder = ('/' + raw.replace(/^\/+|\/+$/g, '')).replace(/\/{2,}/g, '/');

  let exists = null;
  if (await isConnected().catch(() => false)) {
    try {
      await rpc('files/list_folder', { path: folder, limit: 1 });
      exists = true;
    } catch (e) {
      if (/not_found/i.test(e.message)) {
        try {
          await rpc('files/create_folder_v2', { path: folder, autorename: false });
          exists = true;
        } catch (e2) {
          exists = /conflict/i.test(e2.message) ? true : false;
        }
      }
    }
  }

  await saveSettings({ folder });
  res.status(200).json({ ok: true, folder, exists });
}
