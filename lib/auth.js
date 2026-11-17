/**
 * Optional shared-passcode gate.
 *
 * The Vercel URL is public, so if BLOUD_PASSCODE is set every data endpoint
 * requires a cookie obtained by POSTing the passcode to /api/login. Leave the
 * variable unset to keep the app open (e.g. behind Vercel Deployment
 * Protection, or on a private domain).
 */

import crypto from 'node:crypto';

const COOKIE = 'bloud_key';
const PASSCODE = process.env.BLOUD_PASSCODE || '';

export const gateEnabled = Boolean(PASSCODE);

function digest(value) {
  return crypto.createHash('sha256').update(`bloud:${value}`).digest('hex');
}

function cookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

export function isAuthorized(req) {
  if (!PASSCODE) return true;
  const token = cookies(req)[COOKIE];
  if (!token) return false;
  const expected = digest(PASSCODE);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Returns true when the request may continue. */
export function requireAuth(req, res) {
  if (isAuthorized(req)) return true;
  res.status(401).json({ ok: false, error: 'PASSCODE_REQUIRED' });
  return false;
}

export function setAuthCookie(res, passcode) {
  if (!PASSCODE || passcode !== PASSCODE) return false;
  const token = digest(PASSCODE);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; Path=/; Max-Age=15552000; HttpOnly; SameSite=Lax; Secure`,
  );
  return true;
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
}
