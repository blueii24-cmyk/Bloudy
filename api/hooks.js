/**
 * GET /api/hooks — fast bootstrap payload for the client.
 * One small request that tells the app whether it can play music, and what
 * else is configured. Never includes secrets.
 */

import { isConnected, account, oauthConfigured } from '../lib/dbx.js';
import { getFolder } from '../lib/settings.js';
import { storeConfigured } from '../lib/store.js';
import { blobEnabled } from '../lib/media.js';
import { gateEnabled, isAuthorized } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const folder = await getFolder();
  let connected = false;
  let who = null;
  let folderExists = null;
  let syncError = '';

  const vault = storeConfigured;

  try {
    connected = await isConnected();
  } catch {
    connected = false;
  }

  if (connected) {
    try {
      const acc = await account();
      who = { name: acc?.name?.display_name || '', email: acc?.email || '' };
      try {
        await (await import('../lib/dbx.js')).rpc('files/list_folder', { path: folder, limit: 1 });
        folderExists = true;
      } catch (e) {
        folderExists = /not_found/i.test(e.message) ? false : null;
      }
    } catch (e) {
      connected = false;
      syncError = e.status === 401 ? 'Dropbox authorization expired — reconnect' : 'Dropbox API error';
    }
  } else {
    syncError = vault ? 'Dropbox is not connected yet' : 'Server is missing its credential store';
  }

  res.status(200).json({
    ok: true,
    needsPasscode: gateEnabled && !isAuthorized(req),
    oauth: oauthConfigured,
    connected,
    account: who,
    folder,
    serverFolder: folder,
    folderExists,
    syncError,
    vault,
    mediaCache: blobEnabled,
    features: { upload: true, tags: true, offline: true, lyrics: true },
  });
}
