# bloud — deploy runbook

## Current infrastructure (as of 2026-11-17)

| Thing | Value |
| --- | --- |
| GitHub repo | `blueii24-cmyk/Bloudy`, branch `main` |
| Vercel project | **`bloud-app`** — `prj_2VWWPxZEilfv4FL5tP4No1tMX5Uv` (team `BlueLabs`) |
| Vercel git link | `blueii24-cmyk/Bloudy` @ `main` ✅ (correct — auto-deploys on push) |
| Production URL | **`https://bloud-eta.vercel.app`** (plus `bloud-app.vercel.app`) |
| Supabase project | `Bloud` — ref `cjcujxnotnidykpjckci` |
| Supabase tables | `public.bloud_kv`, `public.bloud_auth` — RLS on, anon/authenticated revoked |
| Vercel env set | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (production, preview, development) |
| Missing env | **`DROPBOX_APP_KEY`** — the only blocker |

The previous project `bloud` (`prj_MjdA6ArwmPnAsOiMJQmhCESO1LAs`) was deleted; it
was still git-linked to the old `Bloud` repo on `master`, which meant any push
there would have redeployed the wrong app over the live URL. Its address
`bloud-eta.vercel.app` was moved to the new project first, so **there is no
downtime and the URL is unchanged**. The old `Bloud` repo still exists on GitHub
(the arena integration is not a repo admin, so it could not be deleted or
archived — see `docs/old-repo-backup/README-OLD-REPO.md`); nothing references it
any more.

## What production says right now

```
GET /api/hooks              → {"ok":true,"needsPasscode":false,"oauth":false,
                               "connected":false,"folder":"/bloud","vault":true,...}
GET /api/dbx?action=status  → {"ok":true,"connected":false,"folder":"/bloud"}
GET /api/auth/start         → 400 "Dropbox is not configured yet.
                               Add DROPBOX_APP_KEY in Vercel ... and redeploy."
GET /                        → first-run "Connect your Dropbox folder" card + demo songs
```

## The one step left: `DROPBOX_APP_KEY`

1. <https://www.dropbox.com/developers/apps> → **Create app**
   - **Scoped access**
   - **Full Dropbox**
2. **Permissions** tab → tick and submit:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
3. **OAuth 2** tab → **Redirect URIs** → add exactly:

   ```
   https://bloud-eta.vercel.app/api/auth/callback
   ```

   No app secret is needed (PKCE).
4. Vercel → project **bloud-app** → Settings → Environment Variables →
   `DROPBOX_APP_KEY` for production, preview **and** development → redeploy
   (push to `main`, or Deployments → Redeploy).

Then open <https://bloud-eta.vercel.app> and tap **Connect Dropbox** once — the
previous authorization lived in the deleted Supabase project.

No code change is needed: `lib/dbx.js` reads `oauthConfigured =
Boolean(process.env.DROPBOX_APP_KEY)`, so `/api/auth/start` starts issuing PKCE
redirects as soon as a deployment has the variable.

If the app is later served from `bloud-app.vercel.app` instead, add that
callback URL to the Dropbox app too (`.../api/auth/callback`), or pin
`DROPBOX_REDIRECT_URI`.

## Optional variables

| Variable | Effect |
| --- | --- |
| `BLOUD_FOLDER` | library folder, default `/bloud` |
| `BLOUD_PASSCODE` | gates the public URL behind a passcode (currently **off**) |
| `BLOB_READ_WRITE_TOKEN` + `BLOUD_CACHE_MEDIA=1` | mirror audio into Vercel Blob for faster repeat plays |
| `DROPBOX_REDIRECT_URI` | pin the callback URL if you serve from another host |

## How the deploy was done

The GitHub → Vercel *connector* cannot deploy a project's source tree
(`app.css` alone is a 30 KB single line and must go inline), so deployments use
the Vercel API from a git commit:

```
project  prj_2VWWPxZEilfv4FL5tP4No1tMX5Uv (bloud-app, team BlueLabs)
repo     blueii24-cmyk/Bloudy, branch main
target   production
settings framework vite · build `npm run build` · output `dist` · install `npm install --omit=dev`
```

Because the project is now git-linked to `Bloudy@main`, ordinary pushes to
`main` deploy automatically — no API call needed.

## Local verification

```bash
npm install
BLOUD_MOCK=1 PORT=3100 node scripts/dev-server.mjs   # run in the background
python3 test/e2e.py                                  # expect 43/43
npm run build                                        # stages dist/ (131.6 KB)
```

`python3 test/e2e.py` needs Playwright plus a Chromium build
(`pip install playwright && python3 -m playwright install chromium`).
