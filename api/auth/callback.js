/**
 * GET /api/auth/callback?code=...&state=...
 *
 * Finishes the PKCE exchange, stores the refresh token in the credential vault
 * (Supabase) and returns the browser to the player. No token reaches the page.
 */

import { exchangeCode } from '../../lib/dbx.js';
import { redirectUri, readVerifier } from './start.js';

export default async function handler(req, res) {
  const code = (req.query.code || '').toString();
  const error = (req.query.error || '').toString();

  if (error) {
    res.redirect(302, `/?error=${encodeURIComponent(error)}`);
    return;
  }
  if (!code) {
    res.redirect(302, '/?error=missing_code');
    return;
  }

  const verifier = readVerifier(req);
  if (!verifier) {
    res.redirect(302, '/?error=expired_authorization');
    return;
  }

  try {
    await exchangeCode(code, redirectUri(req), verifier);
    res.setHeader('Set-Cookie', 'bloud_pkce=; Path=/; Max-Age=0; SameSite=Lax');
    res.redirect(302, '/?connected=1');
  } catch (e) {
    res.redirect(302, `/?error=${encodeURIComponent(e.message || 'exchange_failed')}`);
  }
}
