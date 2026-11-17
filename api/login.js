/**
 * POST /api/login  { passcode }  → sets the access cookie
 * DELETE /api/login              → clears it
 * Only active when BLOUD_PASSCODE is configured.
 */

import { setAuthCookie, clearAuthCookie, gateEnabled } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!gateEnabled) {
    res.status(200).json({ ok: true, gate: false });
    return;
  }
  if (req.method === 'DELETE') {
    clearAuthCookie(res);
    res.status(200).json({ ok: true });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }
  const ok = setAuthCookie(res, (req.body?.passcode || '').toString());
  if (!ok) {
    res.status(403).json({ ok: false, error: 'WRONG_PASSCODE' });
    return;
  }
  res.status(200).json({ ok: true, gate: true });
}
