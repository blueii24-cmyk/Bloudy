# Dropbox setup — step by step

You need this once. It produces a single value — an **App key** — which gets
pasted into Vercel. After that, bloud is live.

Sign in to Dropbox as **notblueii24@gmail.com** before you start; that is the
account the app will read `/bloud` from.

---

## Step 1 — Create the Dropbox app

1. Open <https://www.dropbox.com/developers/apps>
2. Click **Create app**.
3. **Choose an API** → select **Scoped access**.
4. **Choose the type of access you need** → select **Full Dropbox**
   (not App folder — bloud needs to see the whole drive to reach `/bloud`).
5. **Name your app** → type `bloud` (any unique name works; if it says the name is
   taken, try `bloud-blue`).
6. Tick the terms box, click **Create app**.

You land on the app's settings page. Leave this tab open.

---

## Step 2 — Turn on the three permissions

1. In the left sidebar, click the **Permissions** tab.
2. Tick exactly these three:

   | Checkbox | Why bloud needs it |
   | --- | --- |
   | `files.metadata.read` | list `/bloud`, read file names and sizes |
   | `files.content.read` | stream the audio and read `.bloud_db.json` |
   | `files.content.write` | save likes, notes and playlists back to Dropbox |

   > The checkbox labelled `account_info.read` is **not** one of the three
   > above, but bloud does call `users/get_current_account` to show your name on
   > the Connect screen. Dropbox enables that scope on Full Dropbox apps by
   > default; if it is shown unticked, tick it too. Nothing breaks without it —
   > the account name just comes back empty.

3. Click **Submit** at the bottom of the page.

   ⚠️ **Do not skip Submit.** The permissions do not take effect until you do,
   and the mistake is invisible later — you only find out when the app lists
   nothing.

---

## Step 3 — Add the redirect URI (exact string)

1. Still in the app, click the **Settings** tab (top of the page).
2. Scroll to **OAuth 2** → the **Redirect URIs** box.
3. Paste this, character for character:

   ```
   https://bloud-eta.vercel.app/api/auth/callback
   ```

   - `https` — not http
   - no trailing slash
   - no spaces before or after
4. Click **Add**.

Dropbox will not accept a near-miss, and the error later is vague, so double
check it against the line above.

---

## Step 4 — Copy the App key

1. On the same **Settings** tab, near the top, find **App key** (a 15-character
   string like `a1b2c3d4e5f6g7h`).
2. Click **Show** / **Copy** next to it.

   You do **not** need the App secret. bloud uses PKCE, which needs only the key.

---

## Step 5 — Paste it into Vercel

1. Open <https://vercel.com/blue-labs1/bloud-app/settings/environment-variables>
   (or: Vercel → team **BlueLabs** → project **`bloud-app`** → Settings →
   Environment Variables).
2. Click **Add New** (or **Create New**).
3. Fill in:
   - **Key**: `DROPBOX_APP_KEY`
   - **Value**: the App key from step 4
   - **Environments**: tick **Production**, **Preview** and **Development** —
     all three
4. Click **Save**.

---

## Step 6 — Redeploy so the variable is picked up

Environment variables only reach a deployment created *after* you saved them.

1. Vercel → project **`bloud-app`** → **Deployments** tab.
2. On the top (production) deployment, open the **⋯** menu → **Redeploy** →
   confirm. Leave "use existing build cache" as it is.
3. Wait for the state to become **Ready** (~20 seconds).

Alternative: push any commit to `main` in `Bloudy`; the project is git-linked
and will rebuild automatically.

---

## Step 7 — Prove it worked

Open <https://bloud-eta.vercel.app/api/hooks>. Before this you got
`"oauth":false`. You now want:

```json
{"ok":true,"oauth":true,"connected":false,"vault":true,"folder":"/bloud", ...}
```

- `oauth: true` → the key is in place.
- `connected: false` → normal; you have not authorized yet.
- `vault: true` → Supabase is fine.

If `oauth` is still `false`, the variable did not reach the deployment — re-check
that all three environments were ticked in step 5 and that you redeployed in
step 6.

Also check <https://bloud-eta.vercel.app/api/auth/start>: it should now redirect
(HTTP 302, `Location: https://www.dropbox.com/oauth2/authorize?...`) instead of
returning the "Dropbox is not configured yet" error.

---

## Step 8 — Connect and load music

1. Open <https://bloud-eta.vercel.app> in your browser.
2. Tap **Connect Dropbox** → Dropbox's consent screen → **Allow**.
3. You come back to `/?connected=1` with a toast. If you see
   `invalid_redirect_uri` instead, step 3's URI is wrong.
4. In Dropbox, put your audio into **`/bloud`** — subfolders become playlists:

   ```
   /bloud
   ├── Sunset Drive/        ← becomes a playlist
   │   ├── 01 - Aria Vale - Neon Tides.mp3
   │   └── cover.jpg
   └── Chill/
       └── Harbor Lights.flac
   ```

   You can delete the leftover `README.md` and `index.html` that are in `/bloud`
   right now — they are clutter from an earlier attempt and are not used.
5. Back in the app, tap **Sync**. Your tracks replace the six demo songs.
6. Play one, seek, open the full player, the lyrics sheet and the queue.
7. Tap **Like** on a track → a file `.bloud_db.json` appears in `/bloud`,
   containing that track's id under `liked`.
8. Reload the page → the like and the library are still there.

That last reload is the one that proves the whole loop: Dropbox reads, Supabase
vault, and the write-back to `.bloud_db.json`.

---

## Notes

- **No App secret anywhere.** The flow is PKCE; only the App key is used, and it
  is read server-side. The browser never sees a Dropbox credential.
- **Redirect URI mismatch** is the most common failure. It must be the exact
  string from step 3, with `https`, no trailing slash.
- **Permissions not submitted** is the second most common: the app connects
  fine but shows an empty library.
- If you ever serve the app from `bloud-app.vercel.app` instead of
  `bloud-eta.vercel.app`, add that callback URL to Dropbox as well
  (`https://bloud-app.vercel.app/api/auth/callback`), or set
  `DROPBOX_REDIRECT_URI` in Vercel to pin one.
