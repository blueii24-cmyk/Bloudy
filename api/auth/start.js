/**
 * GET /api/auth/start
 *
 * Starts the one-time Dropbox authorization with PKCE. The verifier is kept in
 * a short-lived HttpOnly cookie signed with DROPBOX_APP_SECRET — no database
 * round-trip, and the app secret never reaches the browser.
 *
 * Also supports storing a refresh token you already have:
 *   /api/auth/start?refresh_token=...
 */

import crypto from 'node:crypto';
import { APP_KEY, COOKIE_SECRET, oauthConfigured, saveTokens } from '../../lib/dbx.js';

const b64url = (buf) =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (value) =>
  b64url(crypto.createHmac('sha256', COOKIE_SECRET).update(value).digest());

export function redirectUri(req) {
  if (process.env.DROPBOX_REDIRECT_URI) return process.env.DROPBOX_REDIRECT_URI;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}/api/auth/callback`;
}

/** Verify the cookie set by /api/auth/start. */
export function readVerifier(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(/(?:^|;\s*)bloud_pkce=([^;]+)/);
  if (!match) return null;
  const [verifier, sig] = decodeURIComponent(match[1]).split('.');
  if (!verifier || !sig) return null;
  const expected = sign(verifier);
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return verifier;
}

export default async function handler(req, res) {
  if (!oauthConfigured) {
    res.status(400).json({
      ok: false,
      error:
        'Dropbox is not configured yet. Add DROPBOX_APP_KEY in Vercel (Settings → Environment Variables) and redeploy.',
    });
    return;
  }

  const refreshToken = (req.query.refresh_token || '').toString().trim();
  if (refreshToken) {
    await saveTokens({
      access_token: '',
      refresh_token: refreshToken,
      expires_at: 0,
      obtained_at: new Date().toISOString(),
      source: 'manual',
    });
    res.redirect(302, '/?connected=1');
    return;
  }

  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(
    crypto.createHash('sha256').update(verifier).digest(),
  );
  const state = b64url(crypto.randomBytes(16));
  const redirect = redirectUri(req);

  res.setHeader(
    'Set-Cookie',
    `bloud_pkce=${encodeURIComponent(`${verifier}.${sign(verifier)}`)}; Path=/; Max-Age=900; HttpOnly; SameSite=Lax; Secure`,
  );

  const url = new URL('https://www.dropbox.com/oauth2/authorize');
  url.searchParams.set('client_id', APP_KEY);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('token_access_type', 'offline');
  url.searchParams.set('redirect_uri', redirect);
  url.searchParams.set('state', state);

  res.redirect(302, url.toString());
}
