/**
 * Library folder resolution.
 *
 * Precedence: value saved in the app's settings (Supabase) → BLOUD_FOLDER env
 * var → "/bloud". Saved settings are cached per lambda instance.
 */

import { kvGet, kvSet, storeConfigured } from './store.js';

const KEY = 'bloud_settings';
let cached = null;
let cachedAt = 0;

export async function getSettings() {
  if (cached && Date.now() - cachedAt < 30_000) return cached;
  let saved = null;
  if (storeConfigured) {
    try {
      saved = await kvGet(KEY);
    } catch {
      saved = null;
    }
  }
  cached = saved && typeof saved === 'object' ? saved : {};
  cachedAt = Date.now();
  return cached;
}

export async function getFolder() {
  const s = await getSettings();
  const folder = (s.folder || process.env.BLOUD_FOLDER || '/bloud').toString().trim();
  const clean = ('/' + folder.replace(/^\/+|\/+$/g, '')).replace(/\/{2,}/g, '/');
  return clean === '/' ? '/bloud' : clean;
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  if (!storeConfigured) {
    // without a store we can only honour the env var; report it
    return next;
  }
  await kvSet(KEY, next);
  cached = next;
  cachedAt = Date.now();
  return next;
}
