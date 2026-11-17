# bloud — deploy runbook

Status right now:

| Step | State |
| --- | --- |
| Supabase: old project `gaewxsaaaraafyeltiiv` deleted | done |
| Supabase: new project `cjcujxnotnidykpjckci` (Bloud, ap-south-1) created | done |
| `bloud_kv` + `bloud_auth` created, RLS on, anon/authenticated revoked | done |
| Vault round-trip tested (set / overwrite / delete / settings / token) | **verified working** |
| Vercel: stale `VITE_SUPABASE_*` vars deleted | done |
| Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` set for the new project | done |
| Vercel project kept (`bloud`, `bloud-eta.vercel.app`) — code not yet replaced | pending |
| GitHub: old repo delete + new repo with these files | **blocked — no GitHub access here** |

## The one thing left: get these files into a repo

The workspace folder `/home/user/bloud` is a git repo with one clean commit on
`main` (`1484ae1`), 38 tracked files, `.gitignore` excluding `dist/`,
`node_modules/`, `test/shots/` and env files. `bloud-deploy.tar.gz` is the same
tree as an archive.

### Preferred: new repo, push from your machine

```bash
# 1. create an empty repo on GitHub (no README, no .gitignore):
#    github.com/new  →  name it e.g. bloud-app

# 2. push the prepared repo
git clone <handled by you: copy /home/user/bloud from the workspace>
cd bloud
git remote add origin https://github.com/blueii24-cmyk/bloud-app.git
git push -u origin main
```

### Then point the existing Vercel project at it

Vercel → project **bloud** → Settings → Git → **Connect Git Repository** →
`bloud-app`, production branch `main`. Redeploy.

That keeps the URL `https://bloud-eta.vercel.app` (no downtime, old deployments
stay around until replaced), which is what you asked for.

If the first build complains about the framework preset, set:
Framework **Other**, Build Command `npm run build`, Output Directory `dist`.
The project is currently on the `vite` preset, whose build command is already
`npm run build` + `dist`, so it should build as-is.

### GitHub connector alternative

Enable the GitHub app for this conversation and I will do the repo creation,
the file push, and the Vercel connection myself.

## Env vars still needed in Vercel

| Variable | Value |
| --- | --- |
| `DROPBOX_APP_KEY` | **you must supply** — from your Dropbox app |
| `SUPABASE_URL` | `https://cjcujxnotnidykpjckci.supabase.co` (set) |
| `SUPABASE_SERVICE_KEY` | new service_role key (set, stored as sensitive) |
| `BLOUD_FOLDER` | `/bloud` (optional, default) |
| `BLOUD_PASSCODE` | optional: gate the public URL |

## Dropbox console step (unchanged)

Redirect URI must be exact:

```
https://bloud-eta.vercel.app/api/auth/callback
```

Scopes: `files.metadata.read`, `files.content.read`, `files.content.write`,
Scoped access, Full Dropbox. Only the App key is needed (PKCE, no secret).

⚠️ If you already added the redirect URI for the *previous* Supabase set-up, it
is still valid — the new Supabase project only changed the credential vault, not
the URL. But any Dropbox authorization done before now is stored in the **old,
deleted** Supabase project, so you will need to tap **Connect Dropbox** once more
after the redeploy.

## Local verification

```bash
cd bloud
npm run build                                        # stages dist/ (131.6 KB)
BLOUD_MOCK=1 PORT=3100 node scripts/dev-server.mjs   # demo library
python3 test/e2e.py                                  # 43/43 checks
```
