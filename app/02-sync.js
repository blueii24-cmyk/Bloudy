/* ═══════════════════════════════════════════════════════════════════════════
   sync — pull /bloud from Dropbox, merge the database, build the library
   ═══════════════════════════════════════════════════════════════════════════ */

const AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|mp4|m4b|webm)$/i;
const VIDEO_RE = /\.(mp4|webm|m4v)$/i;
const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const LYRIC_RE = /\.(lrc|txt)$/i;
const COVER_NAMES = /^(cover|folder|front|artwork|album|art)\.(jpe?g|png|webp)$/i;

/** "01 - Artist - Title.mp3" → {artist, title, track} */
function parseName(filename, folderName) {
  let base = filename.replace(/\.[^.]+$/, '');
  let track = 0;
  const numMatch = base.match(/^\s*(\d{1,3})\s*[-._)\]]\s+/);
  if (numMatch) { track = parseInt(numMatch[1], 10); base = base.slice(numMatch[0].length); }
  base = base.replace(/_/g, ' ').replace(/\s{2,}/g, ' ').trim();

  let artist = '', title = base;
  // "Artist - Title"
  const dash = base.split(/\s+[–—-]\s+/);
  if (dash.length >= 2 && dash[0].trim()) {
    artist = dash[0].trim();
    title = dash.slice(1).join(' - ').trim();
  }
  if (!artist) {
    const root = (folderName || '').trim();
    artist = root && !/^(bloud|songs|music|audio|tracks)$/i.test(root) ? root : '';
  }
  return { artist, title: title || filename.replace(/\.[^.]+$/, ''), track };
}

function normPath(p) { return (p || '').toLowerCase(); }
function dirOf(p) { const s = p.lastIndexOf('/'); return s <= 0 ? '' : p.slice(0, s); }
function stemOf(p) { return normPath(p).replace(/\.[^.]+$/, ''); }
function baseName(p) { return p.split('/').pop() || ''; }

/** Depth of a path relative to the library root (0 = directly in /bloud). */
function relDepth(path, root) {
  const rel = path.startsWith(root) ? path.slice(root.length) : path;
  return rel.split('/').filter(Boolean);
}

/**
 * Turn the flat Dropbox listing into the app's track list.
 * Side files (.lrc/.txt lyrics, cover images) are attached to their tracks.
 */
function buildLibrary(entries, root) {
  const files = entries
    .filter((e) => (e.tag || e['.tag']) === 'file')
    .map((e) => ({
      id: e.id || e.path || e.path_display,
      path: e.path || e.path_display || '',
      name: e.name || (e.path || e.path_display || '').split('/').pop(),
      size: e.size || 0,
      modified: e.modified || e.server_modified || e.client_modified || '',
    }))
    .filter((e) => e.path);
  const lyrics = new Map();   // stem -> path
  const covers = new Map();   // stem or dir -> path
  const audio = [];

  files.forEach((f) => {
    const name = f.name || '';
    if (name.startsWith('.')) return;               // .bloud_db.json etc.
    if (LYRIC_RE.test(name)) {
      const stem = stemOf(f.path);
      const existing = lyrics.get(stem);
      // prefer .lrc over .txt when both exist
      if (!existing || /\.lrc$/i.test(name)) lyrics.set(stem, f.path);
      return;
    }
    if (IMAGE_RE.test(name)) {
      covers.set(stemOf(f.path), f.path);
      if (COVER_NAMES.test(name)) covers.set(normPath(dirOf(f.path)), f.path);
      return;
    }
    if (AUDIO_RE.test(name)) audio.push(f);
  });

  const folderCounts = new Map();
  const tracks = audio.map((f, idx) => {
    const segs = relDepth(f.path, root);
    const topFolder = segs.length > 1 ? segs[0] : '';
    const parentFolder = segs.length > 1 ? segs[segs.length - 2] : '';
    const parsed = parseName(f.name || '', topFolder);
    const cached = tagCache.get(f.path) || {};
    const stem = stemOf(f.path);
    const dir = normPath(dirOf(f.path));

    if (topFolder) folderCounts.set(topFolder, (folderCounts.get(topFolder) || 0) + 1);

    return {
      id: f.id || f.path,
      path: f.path,
      name: cached.title || parsed.title,
      artist: cached.artist || parsed.artist || 'Unknown artist',
      album: cached.album || topFolder || '',
      albumArtist: cached.albumArtist || '',
      genre: cached.genre || '',
      track: cached.track || parsed.track || 0,
      year: cached.year || '',
      folder: topFolder,
      subfolder: parentFolder,
      dur: cached.duration || 0,
      size: f.size || 0,
      sizeLabel: fmtSize(f.size || 0),
      modified: f.modified || '',
      isVideo: VIDEO_RE.test(f.name || ''),
      lyricsPath: lyrics.get(stem) || '',
      coverPath: cached.coverPath || covers.get(stem) || covers.get(dir) || covers.get(normPath(root)) || '',
      coverData: cached.cover || '',        // embedded art as data URL
      hue: hashHue(f.path),
      demo: false,
      index: idx,
    };
  });

  const sortTracks = (a, b) => {
    if (a.track && b.track && a.track !== b.track) return a.track - b.track;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  };
  tracks.sort(sortTracks);
  tracks.forEach((tr, idx) => { tr.index = idx; });
  return { tracks, folderCounts };
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1048576;
  if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
  if (mb >= 1) return mb.toFixed(1) + ' MB';
  return Math.round(bytes / 1024) + ' KB';
}

/* ── playlists derived from folders ──────────────────────────────────────── */
function folderPlaylists(tracks) {
  const map = new Map();
  tracks.forEach((tr) => {
    if (!tr.folder) return;
    if (!map.has(tr.folder)) map.set(tr.folder, []);
    map.get(tr.folder).push(tr.id);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([name, ids]) => ({ id: 'folder:' + name, name, tracks: ids, auto: true }));
}

function allPlaylists() {
  const auto = folderPlaylists(T);
  const manual = (DB.playlists || []).map((p) => ({ ...p, auto: false }));
  return [...auto, ...manual];
}

function tracksForIds(ids) {
  const byId = new Map(T.map((x) => [x.id, x]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/* ── status + connection state ───────────────────────────────────────────── */
function markDisconnected(reason) {
  server.connected = false;
  syncError = reason || 'Dropbox is not connected';
  renderAll();
}

async function checkStatus({ silent = true } = {}) {
  const tryOnce = async () => {
    try {
      const fetchStatus = () => Api.status();
      const data = await fetchStatus();
      server = {
        connected: !!data.connected,
        folder: data.folder || '/bloud',
        account: data.account || null,
        folderExists: data.folderExists,
        reason: data.reason || '',
        oauth: server.oauth,          // not reported by /api/dbx — keep what boot learned
      };
      if (!data.connected) syncError = data.reason === 'token_rejected'
        ? 'Dropbox authorization expired — reconnect'
        : '';
      else syncError = '';
      return data;
    } catch {
      server.connected = false;
      syncError = 'Server unreachable';
      return { connected: false };
    }
  };

  // the serverless first hit may need to warm up; retry once
  let data = await tryOnce();
  if (!data.connected && !data.reason) {
    await new Promise((r) => setTimeout(r, 1200));
    data = await tryOnce();
  }
  if (!silent) renderAll();
  return data;
}

/* ── the main sync ───────────────────────────────────────────────────────── */
async function sync({ manual = false } = {}) {
  if (syncing) return;
  syncing = true; syncError = '';
  if (manual) toast('Syncing with Dropbox…', 6000);
  renderRefreshState();

  try {
    if (!server.connected) await checkStatus();
    if (!server.connected) {
      T = hydrateCached();
      renderAll();
      if (manual) toast(syncError || 'Connect Dropbox in Settings');
      return;
    }

    const data = await Api.list(server.folder);
    const { tracks, folderCounts } = buildLibrary(data.entries || [], server.folder);
    T = tracks.length ? tracks : [];
    DB.library = tracks.map(compactTrack);
    DB.folderCounts = Object.fromEntries(folderCounts);
    DB.syncedAt = Date.now();

    // merge the remote database, then write it straight back
    try {
      const remoteRaw = await Api.text(dbPath());
      if (remoteRaw && remoteRaw.text) {
        try { mergeRemote(JSON.parse(remoteRaw.text)); } catch { /* ignore bad json */ }
      }
    } catch (e) {
      if (e.status === 404) {
        await Api.write(dbPath(), JSON.stringify(dbPayload(), null, 2)).catch(() => {});
      }
    }

    saveLocalNow();
    if (i >= T.length) i = 0;
    renderAll();
    loadTrackUI();
    pushDB({ now: true });
    enrichTags({ limit: manual ? 12 : 4 });

    if (manual) {
      toast(tracks.length
        ? `Synced ${tracks.length} song${tracks.length === 1 ? '' : 's'} from ${server.folder}`
        : `${server.folder} is empty — upload songs to Dropbox`, 3500);
    }
    if (!tracks.length) renderEmptyLibrary();
  } catch (e) {
    syncError = e.status === 401 ? 'Dropbox authorization expired'
      : e.status === 404 ? `Folder ${server.folder} not found in Dropbox`
      : `Sync failed: ${e.message}`;
    T = T.length ? T : hydrateCached();
    renderAll();
    if (manual) toast(syncError, 4000);
  } finally {
    syncing = false;
    renderRefreshState();
  }
}

/** Slim shape persisted locally so the app opens instantly / offline. */
function compactTrack(tr) {
  return {
    id: tr.id, path: tr.path, name: tr.name, artist: tr.artist, album: tr.album,
    folder: tr.folder, subfolder: tr.subfolder, dur: tr.dur, size: tr.size,
    sizeLabel: tr.sizeLabel, modified: tr.modified, isVideo: tr.isVideo,
    lyricsPath: tr.lyricsPath, coverPath: tr.coverPath, coverData: tr.coverData,
    track: tr.track, genre: tr.genre, year: tr.year, hue: tr.hue, index: tr.index,
  };
}

function hydrateCached() {
  if (!Array.isArray(DB.library) || !DB.library.length) return [];
  return DB.library.map((tr) => ({ ...tr, demo: false }));
}

/* ── tag enrichment (background, in small batches) ───────────────────────── */
let enrichRunning = false;
async function enrichTags({ limit = 6 } = {}) {
  if (enrichRunning || !server.connected) return;
  const pending = T.filter((tr) => !tr.demo && (!tr.tagDone && (tr.coverPath === undefined || !tagCache.has(tr.path))))
    .filter((tr) => !/\.(wav|ogg|oga|opus|flac|weba|webm)$/i.test(tr.path))
    .slice(0, limit);
  if (!pending.length) return;
  enrichRunning = true;
  for (const tr of pending) {
    try {
      const tags = await Api.tags(tr.path);
      tr.tagDone = true;
      if (!tags || !Object.keys(tags).length) { tagCache.set(tr.path, {}); continue; }
      tagCache.set(tr.path, tags);
      let changed = false;
      if (tags.title && tags.title !== tr.name) { tr.name = tags.title; changed = true; }
      if (tags.artist && tags.artist !== tr.artist) { tr.artist = tags.artist; changed = true; }
      if (tags.album) { tr.album = tags.album; changed = true; }
      if (tags.track) tr.track = tags.track;
      if (tags.genre) tr.genre = tags.genre;
      if (tags.year) tr.year = tags.year;
      if (tags.cover && tags.cover.dataUrl) { tr.coverData = tags.cover.dataUrl; changed = true; }
      if (tags.lyrics) { tr.plainLyrics = tags.lyrics; }
      if (changed) {
        DB.library = T.map(compactTrack);
        saveLocal();
      }
      // reflect changes in the current session's lists
      if (changed) { renderAll(); if (i >= 0 && T[i]) loadTrackUI(); }
      await new Promise((r) => setTimeout(r, 120));
    } catch { tr.tagDone = true; }
  }
  enrichRunning = false;
  if (T.some((tr) => !tr.tagDone && !tr.demo)) setTimeout(() => enrichTags({ limit: 8 }), 4000);
}
