/**
 * Supabase-backed key/value store.
 *
 * Only ever called server-side with the service role key. This holds the
 * Dropbox OAuth tokens — never the music library. The library + user data
 * live in the /bloud folder itself, which is the app's real database.
 *
 * Required tables (see README → SQL):
 *   bloud_kv(key text primary key, value jsonb, updated_at timestamptz)
 *   bloud_auth(id text primary key, payload jsonb, created_at timestamptz)
 */

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

export const storeConfigured = Boolean(URL_BASE && KEY);

function headers(extra = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function req(path, init = {}) {
  if (!storeConfigured) throw new Error('STORE_NOT_CONFIGURED');
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: headers(init.headers),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`supabase ${res.status}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

export async function kvGet(key) {
  const rows = await req(
    `bloud_kv?key=eq.${encodeURIComponent(key)}&select=value&limit=1`,
  );
  return rows && rows[0] ? rows[0].value : null;
}

export async function kvSet(key, value) {
  await req('bloud_kv?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([
      { key, value, updated_at: new Date().toISOString() },
    ]),
  });
  return true;
}

export async function kvDel(key) {
  await req(`bloud_kv?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' });
  return true;
}

export async function codePut(id, payload, ttlMs = 10 * 60 * 1000) {
  // opportunistic cleanup of expired pending authorizations
  const cutoff = new Date(Date.now() - ttlMs).toISOString();
  await req(`bloud_auth?created_at=lt.${cutoff}`, { method: 'DELETE' }).catch(
    () => {},
  );
  await req('bloud_auth', {
    method: 'POST',
    body: JSON.stringify([{ id, payload }]),
  });
}

export async function codeTake(id) {
  const rows = await req(
    `bloud_auth?id=eq.${encodeURIComponent(id)}&select=payload&limit=1`,
  );
  await req(`bloud_auth?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).catch(() => {});
  return rows && rows[0] ? rows[0].payload : null;
}
