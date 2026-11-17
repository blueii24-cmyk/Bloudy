/**
 * Dropbox HTTP API v2 client — server side.
 *
 * Two modes:
 *  - "oauth": refresh-token flow (the normal case). Tokens are kept in Supabase.
 *  - "token": a raw access token supplied via DROPBOX_ACCESS_TOKEN env var.
 *
 * Nothing here is ever exposed to the browser: the client only ever talks to
 * /api/dbx/* on the same origin.
 */

import crypto from 'node:crypto';
import { kvGet, kvSet, kvDel, storeConfigured } from './store.js';

const API = 'https://api.dropboxapi.com';
const CONTENT = 'https://content.dropboxapi.com';
const TOKEN_URL = `${API}/oauth2/token`;
const TOKENS_KEY = 'dbx_tokens';

export const APP_KEY = process.env.DROPBOX_APP_KEY || '';
export const APP_SECRET = process.env.DROPBOX_APP_SECRET || '';
export const FOLDER = (process.env.BLOUD_FOLDER || '/bloud').replace(/\/$/, '') || '/bloud';
const STATIC_TOKEN = process.env.DROPBOX_ACCESS_TOKEN || '';

/** PKCE public clients need only the app key; a secret is optional. */
export const oauthConfigured = Boolean(APP_KEY);

/** Secret used to sign the short-lived PKCE cookie. */
export const COOKIE_SECRET =
  process.env.BLOUD_SECRET || APP_SECRET || `bloud:${APP_KEY}` || 'bloud-local';

/* ── token storage ─────────────────────────────────────────────────────── */

let memTokens = null; // per-instance cache

async function loadTokens() {
  if (memTokens && memTokens.access_token && memTokens.expires_at > Date.now() + 60_000) {
    return memTokens;
  }
  if (!storeConfigured) return null;
  try {
    const t = await kvGet(TOKENS_KEY);
    if (t) memTokens = t;
    return t;
  } catch {
    return null;
  }
}

export async function saveTokens(t) {
  memTokens = t;
  if (storeConfigured) await kvSet(TOKENS_KEY, t);
}

export async function clearTokens() {
  memTokens = null;
  if (storeConfigured) await kvDel(TOKENS_KEY).catch(() => {});
}

export async function isConnected() {
  if (STATIC_TOKEN) return true;
  const t = await loadTokens();
  return Boolean(t && t.refresh_token);
}

async function basicAuth() {
  return (
    'Basic ' +
    Buffer.from(`${APP_KEY}:${APP_SECRET}`).toString('base64')
  );
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeCode(code, redirectUri, verifier) {
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
  if (verifier) {
    body.set('code_verifier', verifier);
    body.set('client_id', APP_KEY);
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(verifier ? {} : { Authorization: await basicAuth() }),
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error_description || data.error || 'token_exchange_failed');
    e.status = res.status;
    throw e;
  }
  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 14400) * 1000 - 60_000,
    account_id: data.account_id || '',
    uid: data.uid || '',
    obtained_at: new Date().toISOString(),
  };
  await saveTokens(tokens);
  return tokens;
}

async function refreshTokens(refreshToken) {
  // PKCE public clients refresh with client_id only; confidential apps use Basic auth.
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (APP_SECRET) headers.Authorization = await basicAuth();
  else body.set('client_id', APP_KEY);

  const res = await fetch(TOKEN_URL, { method: 'POST', headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error_description || 'refresh_failed');
    e.status = res.status;
    if (res.status === 400 || res.status === 401) await clearTokens();
    throw e;
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in || 14400) * 1000 - 60_000,
  };
}

/** Current usable access token, refreshing when close to expiry. */
export async function accessToken() {
  if (STATIC_TOKEN) return STATIC_TOKEN;
  const t = await loadTokens();
  if (!t) throw Object.assign(new Error('NOT_CONNECTED'), { status: 401 });
  if (t.access_token && t.expires_at && t.expires_at > Date.now() + 30_000) {
    return t.access_token;
  }
  if (!t.refresh_token) throw Object.assign(new Error('NOT_CONNECTED'), { status: 401 });
  const fresh = await refreshTokens(t.refresh_token);
  const merged = { ...t, ...fresh };
  await saveTokens(merged);
  return merged.access_token;
}

/* ── API calls ─────────────────────────────────────────────────────────── */

async function apiCall(url, { json, headers = {}, retry = true, binary } = {}) {
  const token = await accessToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(binary ? { 'Content-Type': 'application/octet-stream' } : {}),
      ...headers,
    },
    body: binary ? binary : json !== undefined ? JSON.stringify(json) : undefined,
  });
  if (res.status === 401 && retry) {
    memTokens = null;
    return apiCall(url, { json, headers, retry: false, binary });
  }
  return res;
}

export async function rpc(path, payload = null) {
  const res = await apiCall(`${API}/2/${path}`, { json: payload ?? null });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const summary =
      (data && data.error_summary) ||
      (data && data.error && JSON.stringify(data.error)) ||
      text ||
      `Dropbox ${res.status}`;
    const e = new Error(summary);
    e.status = res.status;
    e.dbx = data;
    throw e;
  }
  return data;
}

export async function download(path, { range } = {}) {
  const headers = { 'Dropbox-API-Arg': JSON.stringify({ path }) };
  if (range) headers.Range = range;
  return apiCall(`${CONTENT}/2/files/download`, { headers });
}

export async function downloadText(path) {
  const res = await download(path);
  if (!res.ok) return null;
  return res.text();
}

export async function upload(path, body, mode = 'overwrite') {
  const res = await apiCall(`${CONTENT}/2/files/upload`, {
    headers: {
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode,
        autorename: false,
        mute: true,
      }),
    },
    binary: body,
  });
  const text = await res.text();
  if (!res.ok) {
    const e = new Error(text || `upload failed ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return text ? JSON.parse(text) : null;
}

export async function tempLink(path) {
  const res = await rpc('files/get_temporary_link', { path });
  return res && res.link;
}

/** List every entry under `path`, following pagination. */
export async function listAll(path, { recursive = true } = {}) {
  const out = [];
  let res;
  try {
    res = await rpc('files/list_folder', {
      path: path || '',
      recursive,
      include_media_info: false,
      include_deleted: false,
      limit: 2000,
    });
  } catch (e) {
    if (/not_found|path\/not_found/i.test(e.message)) {
      const err = new Error('FOLDER_NOT_FOUND');
      err.status = 404;
      throw err;
    }
    throw e;
  }
  out.push(...(res.entries || []));
  let cursor = res.cursor;
  let hasMore = res.has_more;
  let guard = 0;
  while (hasMore && cursor && guard++ < 60) {
    const page = await rpc('files/list_folder/continue', { cursor });
    out.push(...(page.entries || []));
    cursor = page.cursor;
    hasMore = page.has_more;
  }
  return out;
}

export async function account() {
  return rpc('users/get_current_account', null);
}

/** Stable key for a Dropbox path, used for blob-cache file names. */
export function pathKey(path) {
  return crypto.createHash('sha1').update(path).digest('hex').slice(0, 16);
}
