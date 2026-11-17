# bloud

Your Dropbox folder, as a music app.

Drop audio files into `/bloud` in Dropbox and bloud streams them, keeps the
artwork and lyrics, and stores your likes, playlists and notes **back into that
same folder** — so every device sees the same library. The UI is a dark
YouTube-Music-style player built for a phone home screen.

```
/bloud
├── Sunset Drive/                    ← subfolder = playlist
│   ├── 01 - Aria Vale - Neon Tides.mp3
│   ├── 01 - Aria Vale - Neon Tides.lrc   ← synced lyrics (optional)
│   └── cover.jpg                         ← folder artwork (optional)
├── Goa Night/
│   └── 02 - Atlas Crew - Run It Back.m4a
├── Chill/
│   └── Harbor Lights.flac
└── .bloud_db.json                   ← created automatically: likes, playlists, notes
```

## Features

- **Folder-as-database** — nothing to import. Subfolders become playlists, new
  uploads appear on the next sync, and the app writes `.bloud_db.json` back to
  Dropbox so likes, dislikes, notes, play counts and playlists follow you
  between devices.
- **Real metadata** — reads ID3v2 (mp3) and iTunes atoms (m4a/mp4) for title,
  artist, album, track number, year, embedded cover art and embedded lyrics.
  Falls back to `Artist - Title.mp3` filename parsing.
- **Artwork + synced lyrics** — `cover.jpg`/`folder.jpg` per folder, or embedded
  cover art. `.lrc` files (or plain `.txt`) auto-match by filename; timestamped
  lyrics scroll and are tappable to seek.
- **Offline** — download individual songs or the whole library; they are stored
  in IndexedDB and play without a connection. The library list and all your
  likes/notes stay available offline too.
- **Streaming that seeks** — playback goes through `/api/stream`, which issues a
  fresh Dropbox temporary link (HTTP Range supported) each time, so seeking
  always works and links never go stale mid-song.
- **Player niceties** — queue, shuffle, repeat one/all, like/dislike, per-song
  notes, playlists, share, lock-screen/Media Session controls, audio and video
  files, a built-in visualiser, voice search and keyboard shortcuts.

## How it is put together

```
api/dbx.js        the app's data API (list / text / write / mkdir / status)
api/stream.js     302 → a playable URL for audio, video or artwork
api/tags.js       fetches just the file head and parses ID3 / MP4 tags
api/upload.js     streams a file from the phone into /bloud
api/auth/start.js Dropbox PKCE authorization (one tap, no token typing)
api/auth/callback.js completes it and stores the refresh token
api/hooks.js      bootstrap payload (connected? which folder?)
api/login.js      optional passcode gate
lib/dbx.js        Dropbox v2 client + token refresh
lib/store.js      Supabase key/value vault for the Dropbox tokens
lib/media.js      temp-link / Vercel Blob URL resolution
lib/settings.js   which folder is the library
app/*.js          the client, concatenated into app.js
```

The browser never sees a Dropbox credential. It talks to `/api/*` on its own
origin; the server holds the refresh token in Supabase and refreshes it as
needed.

## Setup (about five minutes)

### 1. Create a Dropbox app

1. <https://www.dropbox.com/developers/apps> → **Create app**
2. **Scoped access** → **Full Dropbox** → name it anything (`bloud`).
3. **Permissions** tab, tick:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
4. **OAuth 2** tab → *Redirect URIs* → add:
   ```
   https://YOUR-APP.vercel.app/api/auth/callback
   ```
5. Copy the **App key** from the same page.

### 2. Supabase vault

Run once in the Supabase SQL editor (the project already has these tables if you
used the bundled setup):

```sql
create table if not exists public.bloud_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.bloud_auth (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.bloud_kv   enable row level security;
alter table public.bloud_auth enable row level security;
revoke all on public.bloud_kv   from anon, authenticated;
revoke all on public.bloud_auth from anon, authenticated;
```

The current project (`cjcujxnotnidykpjckci`) already has these tables, with RLS
enabled and `anon` / `authenticated` revoked — only the service role can read it.

### 3. Environment variables in Vercel

| Variable | Required | What it is |
| --- | --- | --- |
| `DROPBOX_APP_KEY` | yes | from step 1 |
| `SUPABASE_URL` | yes | `https://cjcujxnotnidykpjckci.supabase.co` |
| `SUPABASE_SERVICE_KEY` | yes | service_role key (server-only) |
| `BLOUD_FOLDER` | no | defaults to `/bloud` |
| `BLOUD_PASSCODE` | no | gate the public URL behind a passcode |
| `BLOB_READ_WRITE_TOKEN` | no | Vercel Blob for faster repeat plays |
| `DROPBOX_APP_SECRET` | no | only for confidential clients |

Redeploy, open the site, tap your avatar → **Connect Dropbox** → approve.
That is the only authorization you will ever do.

### 4. Add music

Drop files in `/bloud` in Dropbox (or use **Upload a song from this device**),
then pull down to sync — or just reopen the app; it re-syncs on launch.

Supported: `mp3`, `m4a`, `m4b`, `aac`, `flac`, `wav`, `ogg`, `opus`, `mp4`,
`webm`. Lyrics: `.lrc` or `.txt`. Artwork: `cover.jpg`, `folder.jpg`,
`front.jpg`, `artwork.jpg`, or embedded.

## Local development

```bash
npm install                 # only needed for the Vercel Blob bonus
cp .env.example .env.local  # fill in Dropbox + Supabase
node scripts/dev-server.mjs # http://localhost:3000
```

No credentials handy? Run it against the built-in mock library:

```bash
BLOUD_MOCK=1 PORT=3100 node scripts/dev-server.mjs
python3 test/e2e.py        # 43 end-to-end checks, writes screenshots to test/shots
```

## Deploying

```bash
npx vercel --prod
```

`vercel.json` sets the function region/duration and long-caches `app.js`; there
is no build step and no framework.

## Notes and limits

- Audio is proxied through Vercel, so playback runs at Vercel's function
  throughput. For a whole large library on repeat, add `BLOB_READ_WRITE_TOKEN`
  and set `BLOUD_CACHE_MEDIA=1` to mirror tracks into Vercel Blob once.
- Vercel caps request bodies at ~4.5 MB, so the in-app uploader is for smaller
  files; bulk uploads belong in the Dropbox app.
- `.bloud_db.json` is written back on every change (debounced). If you edit the
  same library on two devices while both are offline, the later write wins —
  likes and notes are merged, playlists are resolved by most-recent edit.
- `index.html` in the old single-file form is gone; the app is `index.html` +
  `app.js` + `app.css`.
