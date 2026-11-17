/** POST /api/auth/logout — forget the stored Dropbox tokens. */
import { clearTokens } from '../../lib/dbx.js';

export default async function handler(req, res) {
  await clearTokens();
  res.status(200).json({ ok: true });
}
