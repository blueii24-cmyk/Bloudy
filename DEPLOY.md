# bloud — deploy runbook

## Status (verified 2026-11-17)

| Step | State |
| --- | --- |
| Source verified locally against the mock Dropbox | **43/43 e2e checks pass** |
| Source committed to git (`blueii24-cmyk/Bloudy`) | done |
| Production deployment on Vercel project `bloud` | **done — `dpl_88senG9VqEUw3GFU3nx5bjz8e6Sn`, READY** |
| `https://bloud-eta.vercel.app` now serves **this** app | **yes** (previously it served the older `Bloud` repo) |
| Supabase vault (`cjcujxnotnidykpjckci`) reachable, `bloud_kv` + `bloud_auth` present, RLS on | verified |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` in Vercel | verified (`/api/hooks` reports `vault: true`) |
| `DROPBOX_APP_KEY` in Vercel | **still missing — the only blocker** |

### What production says right now

```
GET /api/hooks              → {"ok":true,"needsPasscode":false,"oauth":false,
                               "connected":false,"folder":"/bloud","vault":true,...}
GET /api/dbx?action=status  → {"ok":true,"connected":false,"folder":"/bloud"}
GET /api/settings           → {"ok":true,"folder":"/bloud"}
GET /api/auth/start         → 400 "Dropbox is not configured yet.
                               Add DROPBOX_APP_KEY in Vercel ... and redeploy."
GET /                        → first-run "Connect your Dropbox folder" card + 6 demo songs
```

So the app boots, the vault works, the passcode gate is off, and the only thing
preventing a working player is the Dropbox app key.

## The one step left: `DROPBOX_APP_KEY`

1. <https://www.dropbox.com/developers/apps> → **Create app**
   - **Scoped access**
   - **Full Dropbox** (access to all files and folders)
   - Name it anything, e.g. `bloud`
2. **Permissions** tab → tick and submit:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
3. **OAuth 2** tab → **Redirect URIs** → add exactly:

   ```
   https://bloud-eta.vercel.app/api/auth/callback
   ```

   (No app secret needed — the flow is PKCE, so only the app key is used.)
4. Copy the **App key** and add it in Vercel → project **bloud** → Settings →
   Environment Variables as `DROPBOX_APP_KEY`, for production, preview **and**
   development. Redeploy (env changes only apply to new deployments).

Then open <https://bloud-eta.vercel.app> and tap **Connect Dropbox** once — the
previous authorization lived in the deleted Supabase project.

Setting the variable does not require any code change: `lib/dbx.js` reads it as
`oauthConfigured = Boolean(process.env.DROPBOX_APP_KEY)`, so `/api/auth/start`
starts issuing PKCE redirects the moment a new deployment has the variable.

## Optional variables

| Variable | Effect |
| --- | --- |
| `BLOUD_FOLDER` | library folder, default `/bloud` |
| `BLOUD_PASSCODE` | gates the public URL behind a passcode (currently **off**) |
| `BLOB_READ_WRITE_TOKEN` + `BLOUD_CACHE_MEDIA=1` | mirror audio into Vercel Blob for faster repeat plays |
| `DROPBOX_REDIRECT_URI` | pin the callback URL if you serve from another host |

## How the deploy was done

The GitHub → Vercel *connector* cannot push this app (the source has to go
inline and `app.css` alone is a 30 KB single line), so the deployment was made
with the Vercel API against the existing project, from the git commit:

```
commit  Bloudy @ arena/cb10c35e-bloudy
project prj_MjdA6ArwmPnAsOiMJQmhCESO1LAs (bloud, team BlueLabs)
target  production
```

The project was **not** deleted, so `bloud-eta.vercel.app`, the env vars and the
registered Dropbox redirect URI are all preserved.

⚠️ The project's *git link* still points at the old `blueii24-cmyk/Bloud` repo
(`master`). Pushes there will not redeploy this code, but the link means a push
to that repo would produce a deployment of the old app. Re-point it at
`blueii24-cmyk/Bloudy`, production branch `main`, in Vercel → project `bloud` →
Settings → Git, when convenient.

## Local verification

```bash
npm install
BLOUD_MOCK=1 PORT=3100 node scripts/dev-server.mjs   # run in the background
python3 test/e2e.py                                  # expect 43/43
npm run build                                        # stages dist/ (131.6 KB)
```

`python3 test/e2e.py` needs Playwright plus a Chromium build
(`pip install playwright && python3 -m playwright install chromium`).
