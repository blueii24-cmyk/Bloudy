/**
 * POST /api/dbx — the app's only data API.
 *
 * Body: { action, ...args }
 * The browser never sees a Dropbox credential; it only talks to this endpoint.
 */

import { requireAuth } from '../lib/auth.js';
import {
  rpc,
  downloadText,
  upload,
  account,
  listAll,
  tempLink,
  isConnected,
  FOLDER,
} from '../lib/dbx.js';

export const config = { maxDuration: 60 };

function bad(res, status, message, extra = {}) {
  res.status(status).json({ ok: false, error: message, ...extra });
}

function normalize(entries, base) {
  return entries.map((e) => {
    const path = e.path_display || e.path_lower || '';
    return {
      tag: e['.tag'],
      name: e.name,
      path,
      id: e.id || path,
      size: e.size || 0,
      modified: e.server_modified || e.client_modified || '',
      rev: e.rev || '',
      rel: path.startsWith(base) ? path.slice(base.length).replace(/^\//, '') : path,
    };
  });
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) || '';
  const input = req.method === 'GET' ? req.query : req.body || {};

  if (action === 'status') {
    const connected = await isConnected().catch(() => false);
    let who = null;
    let folderOk = null;
    if (connected) {
      try {
        const acc = await account();
        who = { name: acc?.name?.display_name || '', email: acc?.email || '' };
      } catch (e) {
        return res.status(200).json({
          ok: true,
          connected: false,
          reason: e.status === 401 ? 'token_rejected' : 'api_error',
          detail: e.message,
          folder: FOLDER,
        });
      }
      try {
        await rpc('files/list_folder', { path: FOLDER, limit: 1 });
        folderOk = true;
      } catch (e) {
        folderOk = /not_found/i.test(e.message) ? false : null;
      }
    }
    return res.status(200).json({
      ok: true,
      connected,
      account: who,
      folder: FOLDER,
      folderExists: folderOk,
    });
  }

  if (!(await isConnected().catch(() => false))) {
    return bad(res, 401, 'NOT_CONNECTED');
  }

  try {
    switch (action) {
      case 'list': {
        const folder = (input.folder || FOLDER).toString();
        const entries = await listAll(folder, { recursive: true });
        return res.status(200).json({
          ok: true,
          folder,
          entries: normalize(entries, folder),
          syncedAt: new Date().toISOString(),
        });
      }

      case 'text': {
        if (!input.path) return bad(res, 400, 'path required');
        const text = await downloadText(input.path.toString());
        if (text === null) return bad(res, 404, 'not_found');
        return res.status(200).json({ ok: true, text });
      }

      case 'temp': {
        if (!input.path) return bad(res, 400, 'path required');
        const link = await tempLink(input.path.toString());
        return res.status(200).json({ ok: true, url: link, expiresIn: 14000 });
      }

      case 'write': {
        if (!input.path) return bad(res, 400, 'path required');
        const body =
          typeof input.content === 'string'
            ? input.content
            : JSON.stringify(input.content ?? {});
        const meta = await upload(input.path.toString(), bufferOf(body));
        return res.status(200).json({ ok: true, rev: meta?.rev || '', size: meta?.size || body.length });
      }

      case 'mkdir': {
        if (!input.path) return bad(res, 400, 'path required');
        try {
          await rpc('files/create_folder_v2', { path: input.path.toString(), autorename: false });
        } catch (e) {
          if (!/conflict/i.test(e.message)) throw e;
        }
        return res.status(200).json({ ok: true });
      }

      default:
        return bad(res, 400, `unknown action: ${action}`);
    }
  } catch (e) {
    if (e.status === 401) return bad(res, 401, 'NOT_CONNECTED');
    if (/not_found/i.test(e.message)) return bad(res, 404, 'not_found', { detail: e.message });
    return bad(res, 500, e.message || 'dropbox_error');
  }
}

function bufferOf(str) {
  return Buffer.from(str, 'utf8');
}
