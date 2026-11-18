/* ═══════════════════════════════════════════════════════════════════════════
   bloud — core: helpers, persistent state, API client, caches
   ═══════════════════════════════════════════════════════════════════════════ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const P = {
  play: 'M8 5v14l11-7z', pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  next: 'M6 18l8.5-6L6 6zM16 6h2v12h-2z', prev: 'M18 6l-8.5 6 8.5 6zM6 6h2v12H6z',
  dots: 'M12 8a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4zm0 6a2 2 0 100-4 2 2 0 000 4z',
  thumb: 'M1 21h4V9H1zm22-11a2 2 0 00-2-2h-6.3l1-4.6V3a1.5 1.5 0 00-.4-1L14.2 1 7.6 7.6A2 2 0 007 9v10a2 2 0 002 2h9a2 2 0 001.8-1.2l3-7c.1-.2.2-.5.2-.8z',
  cast: 'M2 8V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-6M2 12a9 9 0 019 9M2 16a5 5 0 015 5M2 20h.01',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z', library: 'M6 3h12v18l-6-4-6 4z',
  chev: 'M6 9l6 6 6-6', chevR: 'M9 6l6 6-6 6',
  head: 'M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1v-6H5a2 2 0 00-2 2zM21 18a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2z',
  video: 'M4 5h16v14H4zM10 9l5 3-5 3z',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3',
  quote: 'M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z',
  comment: 'M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  save: 'M3 6h13M3 12h13M3 18h8M18 15v6M15 18h6',
  share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13',
  download: 'M12 3v12M7 11l5 5 5-5M5 21h14',
  close: 'M6 6l12 12M18 6L6 18', back: 'M19 12H5M12 19l-7-7 7-7',
  mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3',
  wave: 'M4 10v4M8 6v12M12 3v18M16 8v8M20 11v2',
  history: 'M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5M12 7v5l3 2',
  upleft: 'M17 17L7 7M7 17V7h10', plus: 'M12 5v14M5 12h14',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  disc: 'M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z',
  cloud: 'M17.5 19H9a7 7 0 116.7-9h1.8a4.5 4.5 0 010 9z', check: 'M5 13l4 4L19 7',
  refresh: 'M21 12a9 9 0 11-2.6-6.4M21 3v6h-6',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  queue: 'M4 6h16M4 12h16M4 18h10', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  folder: 'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z',
};
const I = (n, f, c = '') =>
  `<svg viewBox="0 0 24 24" class="${f ? 'f ' : ''}${c}"><path d="${P[n] || P.disc}"/></svg>`;
const fmt = (s) => {
  s = Math.max(0, Number(s) || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const hashHue = (s) => { let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) % 360; return Math.abs(h); };
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const uniq = (a) => [...new Set(a)];
const dayKey = () => new Date().toISOString().slice(0, 10);

/* ── persistent local state (offline mirror; Dropbox is the source of truth) ─ */
const STORE_KEY = 'bloud_v2';
const DEFAULT_DB = () => ({
  liked: {}, disliked: {}, notes: {}, playCounts: {}, recentIds: [],
  playlists: [], searchHist: [], firstPlay: {},
  library: [],          // last synced track list
  syncedAt: 0,
  ui: { sort: 0, homeCat: '', libCat: 'Playlists', shuffle: false, repeat: 0, volume: 1 },
  prefs: { autoSync: true, cacheMedia: true, offlineMode: false }, folderCounts: {},
});
let DB = (() => {
  try { return Object.assign(DEFAULT_DB(), JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); }
  catch { return DEFAULT_DB(); }
})();
DB.ui = Object.assign(DEFAULT_DB().ui, DB.ui || {});
DB.prefs = Object.assign(DEFAULT_DB().prefs, DB.prefs || {});

let saveTimer = 0;
const saveLocal = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch { /* quota */ }
  }, 120);
};
const saveLocalNow = () => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch { /* quota */ }
};

/* ── built-in demo songs (only shown when Dropbox has nothing yet) ───────── */
const DEMO_LINES = [
  'Streetlights bending on the glass', 'Counting every mile we pass',
  'Radio low, the city hums', 'Waiting for the night to come',
  'Hold on, hold on, we’re almost there', 'Wind is tangled in your hair',
  'Take the long way, take it slow', 'Neither of us has to go',
  'Let the morning find us late', 'Some things are worth the wait',
];
const DEMO = [
  ['Neon Tides', 'Aria Vale', 214], ['Paper Planes', 'The Lanterns', 186],
  ['Golden Hour Loop', 'Kiro', 232], ['Quiet Orbit', 'Mira Sol', 245],
  ['Run It Back', 'Atlas Crew', 176], ['Slow Rain, Warm Room', 'Aria Vale', 224],
].map(([name, artist, dur], k) => ({
  id: 'demo:' + k, path: '', name, artist, album: 'Demo Session',
  folder: '', subfolder: '', dur, size: 0, sizeLabel: 'Demo', modified: '',
  isVideo: false, lyricsPath: '', coverPath: '', coverData: '', track: 0,
  genre: '', year: '', hue: (k * 47 + 190) % 360, demo: true, index: k,
  lyrics: {
    lines: DEMO_LINES.map((line, j) => [6 + j * ((dur - 12) / DEMO_LINES.length), line]),
    synced: true,
  },
}));

/* cover URLs are stable per path — cache the <img> src, not a temp link */
const coverUrl = (tr) => (tr && tr.coverPath ? Api.streamUrl(tr.coverPath, 'image') : '');

/* ── runtime state ───────────────────────────────────────────────────────── */
let T = [];              // visible track list
let i = 0, t = 0, playing = false, act = -2, mode = '', isSeeking = false;
let queue = [], qPos = 0;
let playHist = [];
let shuffleOn = !!DB.ui.shuffle, repeatMode = DB.ui.repeat | 0;
let server = { connected: false, folder: '/bloud', account: null, folderExists: null, oauth: true };
let syncing = false, syncError = '';
let offlineIds = new Set();
const tagCache = new Map();       // path -> {title,artist,album,cover}
const coverCache = new Map();     // path -> object URL
const lrcCache = new Map();       // path -> parsed lines
let vizRaf = 0, demoTimer = null, activeBlobUrl = '', currentObjUrl = '';
let hasPlayed = false;

/* ── toast ───────────────────────────────────────────────────────────────── */
let toastTm = 0;
function toast(msg, ms = 2400) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('on');
  clearTimeout(toastTm);
  toastTm = setTimeout(() => el.classList.remove('on'), ms);
}

/* ── API client (same-origin only) ───────────────────────────────────────── */
const Api = {
  async call(action, args = {}, { timeout = 45000 } = {}) {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch('/api/dbx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...args }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const err = new Error(data.error || `http_${res.status}`);
        err.status = res.status; err.data = data;
        throw err;
      }
      return data;
    } finally { clearTimeout(tm); }
  },
  status() {
    return fetch('/api/dbx?action=status', { cache: 'no-store' })
      .then((r) => r.json()).catch(() => ({ ok: false, connected: false }));
  },
  list(folder) { return this.call('list', { folder }); },
  text(path) { return this.call('text', { path }); },
  write(path, content) { return this.call('write', { path, content }); },
  mkdir(path) { return this.call('mkdir', { path }); },
  async tags(path) {
    const res = await fetch(`/api/tags?path=${encodeURIComponent(path)}`);
    const data = await res.json().catch(() => ({ tags: {} }));
    return data.tags || {};
  },
  streamUrl(path, kind) {
    return `/api/stream?path=${encodeURIComponent(path)}${kind ? `&kind=${kind}` : ''}`;
  },
};

/* ── IndexedDB: offline audio + tag cache + cover cache ──────────────────── */
const IDB = {
  db: null,
  open() {
    return new Promise((resolve) => {
      if (this.db) return resolve(this.db);
      try {
        const r = indexedDB.open('bloud_store', 2);
        r.onupgradeneeded = (e) => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains('audio')) d.createObjectStore('audio');
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta');
        };
        r.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
        r.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  },
  async _tx(store, mode, fn) {
    const d = await this.open();
    if (!d) return null;
    return new Promise((resolve) => {
      try {
        const tx = d.transaction(store, mode);
        const fnRes = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(fnRes && 'result' in fnRes ? fnRes.result : true);
        tx.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  },
  async put(store, key, val) {
    const d = await this.open(); if (!d) return false;
    return new Promise((resolve) => {
      const tx = d.transaction(store, 'readwrite');
      tx.objectStore(store).put(val, key);
      tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false);
    });
  },
  async get(store, key) {
    const d = await this.open(); if (!d) return null;
    return new Promise((resolve) => {
      const tx = d.transaction(store, 'readonly');
      const q = tx.objectStore(store).get(key);
      q.onsuccess = () => resolve(q.result ?? null); q.onerror = () => resolve(null);
    });
  },
  async del(store, key) {
    const d = await this.open(); if (!d) return false;
    return new Promise((resolve) => {
      const tx = d.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve(true); tx.onerror = () => resolve(false);
    });
  },
  async keys(store) {
    const d = await this.open(); if (!d) return [];
    return new Promise((resolve) => {
      const tx = d.transaction(store, 'readonly');
      const q = tx.objectStore(store).getAllKeys();
      q.onsuccess = () => resolve(q.result || []); q.onerror = () => resolve([]);
    });
  },
};

/* ── the remote database: /bloud/.bloud_db.json ──────────────────────────── */
const dbPath = () => `${server.folder.replace(/\/$/, '')}/.bloud_db.json`;
let pushTimer = 0, pushing = false, pushAgain = false;

function dbPayload() {
  return {
    app: 'bloud', version: 2,
    updatedAt: new Date().toISOString(),
    liked: DB.liked, disliked: DB.disliked, notes: DB.notes,
    playCounts: DB.playCounts, playlists: DB.playlists,
    recentIds: DB.recentIds, searchHist: DB.searchHist, firstPlay: DB.firstPlay,
  };
}

/** Debounced write-back. Never throws at the UI. */
function pushDB({ now = false } = {}) {
  if (!server.connected) return;
  clearTimeout(pushTimer);
  const run = async () => {
    if (pushing) { pushAgain = true; return; }
    pushing = true;
    try {
      await Api.write(dbPath(), JSON.stringify(dbPayload(), null, 2));
    } catch (e) {
      if (e.status === 401) markDisconnected();
      pushAgain = true;
    } finally {
      pushing = false;
      if (pushAgain) { pushAgain = false; pushTimer = setTimeout(run, 2500); }
    }
  };
  if (now) run(); else pushTimer = setTimeout(run, 1400);
}

/** Merge remote state into local without losing local-only edits. */
function mergeRemote(remote) {
  if (!remote || typeof remote !== 'object') return false;
  const remoteTime = Date.parse(remote.updatedAt || '') || 0;
  const localIsNewer = DB.localEditAt && DB.localEditAt > remoteTime;

  const mergeMap = (key, preferLocal) => {
    const rem = remote[key] && typeof remote[key] === 'object' ? remote[key] : {};
    DB[key] = preferLocal && localIsNewer ? { ...rem, ...(DB[key] || {}) } : { ...(DB[key] || {}), ...rem };
  };
  mergeMap('liked', true);
  mergeMap('disliked', true);
  mergeMap('notes', true);
  mergeMap('playCounts', true);
  mergeMap('firstPlay', true);

  if (Array.isArray(remote.playlists)) {
    const byId = new Map((DB.playlists || []).map((p) => [p.id, p]));
    remote.playlists.forEach((p) => {
      if (!p || !p.id) return;
      const local = byId.get(p.id);
      // newest edit wins
      if (!local || (p.updatedAt || 0) >= (local.updatedAt || 0)) byId.set(p.id, p);
    });
    DB.playlists = [...byId.values()];
  }
  if (Array.isArray(remote.recentIds)) {
    DB.recentIds = uniq([...(DB.recentIds || []), ...remote.recentIds]).slice(0, 30);
  }
  if (Array.isArray(remote.searchHist)) {
    DB.searchHist = uniq([...(DB.searchHist || []), ...remote.searchHist]).slice(0, 10);
  }
  return true;
}
/* ═══════════════════════════════════════════════════════════════════════════
   sync — pull /bloud from Dropbox, merge the database, build the library
   ═══════════════════════════════════════════════════════════════════════════ */

const AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|mp4|m4b|webm)$/i;
const VIDEO_RE = /\.(mp4|webm|m4v)$/i;
const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const LYRIC_RE = /\.(lrc|txt|ttml)$/i;
const COVER_NAMES = /^(cover|folder|front|artwork|album|art)\.(jpe?g|png|webp)$/i;

/** "01 - Artist - Title.mp3" → {artist, title, track} */
/** "queen-poet" → "Queen Poet"; leaves already-cased text alone. */
/** Strip download-site junk: "(MP3_320K)", "[Official Video]", "(Lyrics)". */
function cleanTitle(str) {
  return String(str || '')
    .replace(/\((?:mp3|m4a|320k|128k|256k|hq)[^)]*\)/gi, ' ')
    .replace(/\((?:official\s*)?(?:music\s*)?(?:video|audio|lyric[s]?)\b[^)]*\)/gi, ' ')
    .replace(/\[(?:official\s*)?(?:music\s*)?(?:video|audio|lyric[s]?)\b[^\]]*\]/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function prettify(str) {
  const v = String(str || '').replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!v) return '';
  // only re-case all-lower / all-upper values, so "ARJN" or "d4vd" survive
  if (v === v.toLowerCase() || v === v.toUpperCase()) {
    return v.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return v;
}

function parseName(filename, folderName, folderPath) {
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
    /* Stash layout is /bloud/Stash/<artist>/<album>/<song>.m4a, so the artist
       is not the top folder (that is "Stash") — it is the folder two levels up
       from the file. Falling back to the top folder made every song show as
       "Stash". */
    const segs = (folderPath || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    const skip = /^(bloud|stash|songs|music|audio|tracks)$/i;
    const real = segs.filter((seg) => seg && !skip.test(seg));
    /* <artist>/<album>/file → the artist is the second-deepest folder. With a
       single folder there is no album, so that folder is the artist. */
    if (real.length) {
      artist = prettify(real.length >= 2 ? real[real.length - 2] : real[0]);
    } else if (folderName) {
      /* Called with just a folder name (no full path) — e.g. a flat
         /bloud/<Folder>/song.mp3 layout. Honour it as the artist. */
      const root = folderName.trim();
      artist = skip.test(root) ? '' : prettify(root);
    }
  }
  return { artist, title: prettify(cleanTitle(title)) || prettify(cleanTitle(base)) || base, track };
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
      /* Preference order when a song ships several lyric files: .lrc (clean
         line-level timing) beats .ttml (word-level, verbose) beats .txt. */
      const rank = (p) => (/\.lrc$/i.test(p) ? 3 : /\.ttml$/i.test(p) ? 2 : 1);
      if (!existing || rank(name) > rank(baseName(existing))) lyrics.set(stem, f.path);
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
    const parsed = parseName(f.name || '', topFolder, dirOf(f.path));
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
    lyricsPath: tr.lyricsPath, coverPath: tr.coverPath,
    /* coverData is deliberately NOT persisted here: it is a base64 JPEG that
       runs to ~600 KB per song for m4a artwork, and localStorage caps around
       5 MB. Persisting it silently blew the quota, so the whole library entry
       failed to save and the cache never refreshed. Artwork lives in
       IndexedDB instead (see coverStoreKey / hydrateCovers). */
    track: tr.track, genre: tr.genre, year: tr.year, hue: tr.hue, index: tr.index,
  };
}

/* ── artwork cache (IndexedDB, not localStorage) ─────────────────────────── */
const coverStoreKey = (tr) => 'cover:' + tr.path;

async function saveCoverToIdb(tr) {
  if (!tr || !tr.coverData) return;
  try { await IDB.set('meta', coverStoreKey(tr), tr.coverData); } catch { /* quota */ }
}

/** Re-attach cached artwork after a reload, without hitting the network. */
async function hydrateCovers() {
  if (!T.length) return;
  let changed = false;
  for (const tr of T) {
    if (tr.coverData || tr.demo) continue;
    try {
      const data = await IDB.get('meta', coverStoreKey(tr));
      if (data) { tr.coverData = data; changed = true; }
    } catch { /* ignore */ }
  }
  if (changed) renderAll();
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
      if (tags.cover && tags.cover.dataUrl) {
        tr.coverData = tags.cover.dataUrl;
        changed = true;
        saveCoverToIdb(tr);          // big blob → IndexedDB
      }
      if (tags.lyrics) { tr.plainLyrics = tags.lyrics; }
      /* Duration comes from the m4a's mvhd atom. Without it every row shows
         0:00 and the seek bar cannot scale, so treat it as a real change. */
      if (tags.duration && Math.abs((tr.dur || 0) - tags.duration) > 0.5) {
        tr.dur = tags.duration; changed = true;
      }
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
/* ═══════════════════════════════════════════════════════════════════════════
   render — home, search, library, lists, modals (same UI as before, real data)
   ═══════════════════════════════════════════════════════════════════════════ */

const SORTS = ['Recently played', 'Title A–Z', 'Artist A–Z', 'Recently added'];
let libSort = DB.ui.sort | 0, libCat = DB.ui.libCat || 'Playlists', homeCat = DB.ui.homeCat || '';

/* ── artwork ─────────────────────────────────────────────────────────────── */
const artStyle = (tr) => {
  if (!tr) return '--h:200';
  if (tr.coverPath) return `--h:${tr.hue};--img:url('${coverUrl(tr)}')`;
  if (tr.coverData) return `--h:${tr.hue};--img:url('${tr.coverData}')`;
  return `--h:${tr.hue || 200}`;
};
const initials = (tr) => {
  const source = tr.artist && tr.artist !== 'Unknown artist' ? tr.artist : tr.name;
  return (source || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
};
const art = (tr, cls = '') => {
  if (!tr) return `<div class="art ${cls}" style="--h:220"></div>`;
  const hasImg = !!(tr.coverPath || tr.coverData);
  if (hasImg) return `<div class="art has-img ${cls}" style="${artStyle(tr)}"></div>`;
  return `<div class="art ${cls}" style="${artStyle(tr)}"><span class="ini">${esc(initials(tr))}</span></div>`;
};

/* ── rows & containers ───────────────────────────────────────────────────── */
function row(tr) {
  if (!tr) return '';
  const k = T.indexOf(tr);
  const isNow = T[i] && T[i].id === tr.id;
  const off = offlineIds.has(tr.id);
  /* Duration if known. File size only as a last resort — it is not a duration
     and reading "9.2 MB" next to a play button is misleading. */
  const dur = tr.dur ? fmt(tr.dur) : '';
  const sub = [tr.artist, dur].filter(Boolean).join(' • ') || tr.sizeLabel || '';
  return `<div class="row${isNow ? ' playing' : ''}" data-k="${k}">${art(tr)}
    <div class="meta"><b>${esc(tr.name)}</b><span>${off ? ck : ''}${esc(sub)}</span></div>
    <button class="ic dots" data-dot="${k}" aria-label="More">${I('dots', 1)}</button></div>`;
}
const ck = '<svg class="vb" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#aaa"/><path d="M7 12l3.5 3.5L17 9" stroke="#000" stroke-width="2.5" fill="none"/></svg>';

function cols(tracks) {
  if (!tracks.length) return `<div class="empty" style="padding:28px 0;font-size:14px">Nothing here yet.</div>`;
  const groups = [];
  tracks.forEach((tr, j) => (j % 4 ? groups[groups.length - 1].push(tr) : groups.push([tr])));
  return `<div class="hs snap">${groups.map((g) => `<div class="col">${g.map(row).join('')}</div>`).join('')}</div>`;
}

const sec = (title, tracks, extra = '') => `<div class="sh"><h2>${esc(title)}</h2>
  <div class="act">${extra}${tracks.length ? `<button class="pa" data-playlist-ids="${esc(tracks.map((x) => x.id).join('|'))}">Play all</button>` : ''}</div></div>`;

const tile = (tr) => tr ? `<div class="tile" data-k="${T.indexOf(tr)}" style="${artStyle(tr)}"><b>${esc(tr.name)}</b></div>` : '';

const disc = (tr) => tr ? `<div class="dc" data-k="${T.indexOf(tr)}" style="--h:${tr.hue}">
  <b>${esc(tr.name)}</b><span><em>${tr.isVideo ? 'VID' : 'HQ'}</em>${esc(tr.artist)} • ${esc(tr.sizeLabel)}</span>${art(tr)}</div>` : '';

const gcard = (tr, title, sub) => `<div class="gcard" data-k="${T.indexOf(tr)}">${art(tr)}<b>${esc(title)}</b><span>${esc(sub)}</span></div>`;

/* ── derived views ───────────────────────────────────────────────────────── */
function filteredByCat(cat) {
  if (!cat) return T;
  const c = cat.toLowerCase();
  const hits = T.filter((tr) =>
    `${tr.folder} ${tr.album} ${tr.genre} ${tr.name} ${tr.artist}`.toLowerCase().includes(c));
  return hits.length ? hits : T;
}

function artists() {
  const map = new Map();
  T.forEach((tr) => {
    const key = tr.artist || 'Unknown artist';
    if (!map.has(key)) map.set(key, { name: key, tracks: [] });
    map.get(key).tracks.push(tr);
  });
  return [...map.values()].sort((a, b) => b.tracks.length - a.tracks.length || a.name.localeCompare(b.name));
}

function albums() {
  const map = new Map();
  T.forEach((tr) => {
    const key = `${tr.album || tr.folder || 'Singles'}\u0000${tr.artist}`;
    if (!map.has(key)) map.set(key, { name: tr.album || tr.folder || 'Singles', artist: tr.artist, tracks: [] });
    map.get(key).tracks.push(tr);
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const likedTracks = () => T.filter((tr) => DB.liked[tr.id]);
const recentTracks = () => DB.recentIds.map((id) => T.find((x) => x.id === id)).filter(Boolean);
const downloadedTracks = () => T.filter((tr) => offlineIds.has(tr.id));

/* ── empty / setup states ────────────────────────────────────────────────── */
function setupCard() {
  if (server.connected) {
    return `<div class="setup"><h3>${I('cloud')} Waiting for music</h3>
      <p>Drop audio files into <code>${esc(server.folder)}</code> in your Dropbox — subfolders become playlists. Then tap Sync.</p>
      <div class="row-line"><button data-sync="1">Sync now</button>
      <button class="sec" data-folder-upload="1">Add a song from this device</button></div></div>`;
  }
  return `<div class="setup"><h3>Connect your Dropbox folder</h3>
    <p>bloud keeps your music in <code>${esc(server.folder)}</code>. Authorize once and this app becomes your personal streaming service — the songs stay in your Dropbox.</p>
    <div class="row-line"><button data-connect="1">${I('cloud')} Connect Dropbox</button>
    <button class="sec" data-open-settings="1">Settings</button></div></div>`;
}

function renderEmptyLibrary() {
  const el = $('#home');
  if (el) el.innerHTML = `<div class="top"><div class="brand"><span class="lg">${I('play', 1)}</span><b>bloud</b></div>
    <div class="tr"><div id="avBtn" style="cursor:pointer">${art(null, 'c av')}</div></div></div>
    ${setupCard()}
    <p class="note">Supported: MP3, M4A, AAC, FLAC, WAV, OGG, OPUS. Add a matching <b>.lrc</b> file for synced lyrics, and <b>cover.jpg</b> (or embedded art) for artwork.</p>`;
}

/* ── first-run welcome (no Dropbox yet) ─────────────────────────────────── */
function renderWelcome() {
  const el = $('#home');
  el.innerHTML = `<div class="top"><div class="brand"><span class="lg">${I('play', 1)}</span><b>bloud</b></div>
      <div class="tr"><div id="avBtn" style="cursor:pointer">${art(T[0] || null, 'c av')}</div></div></div>
    ${setupCard()}
    <div class="sh"><h2>Try it out</h2><div class="act"><button class="pa" data-playlist-ids="${esc(T.map((x) => x.id).join('|'))}">Play all</button></div></div>
    <p class="mnote" style="margin:-4px 0 8px">These six demo songs are built in so you can try the player. Your own
      music replaces them the moment <code>${esc(server.folder)}</code> has audio files in it.</p>
    ${T.map(row).join('')}
    <p class="note">${syncError ? esc(syncError) : 'Not connected to Dropbox yet.'}</p>`;
}

/* ── home ────────────────────────────────────────────────────────────────── */
function renderHome() {
  const el = $('#home');
  if (!el) return;
  if (!T.length) { renderEmptyLibrary(); return; }
  // first run: nothing from Dropbox yet → lead with the connect prompt
  if (!server.connected && T.every((tr) => tr.demo)) { renderWelcome(); return; }

  const pool = filteredByCat(homeCat);
  const take = (n, off = 0) => Array.from({ length: Math.min(n, pool.length) }, (_, j) => pool[(j + off) % pool.length]);
  const folderNames = uniq(T.map((tr) => tr.folder).filter(Boolean));
  const baseChips = ['Podcasts', 'Romance', 'Feel good', 'Work out', 'Focus'];
  const chips = uniq([...folderNames.slice(0, 5), ...baseChips]).slice(0, 8);

  const likedCount = likedTracks().length;
  const lkPct = T.length ? clamp(Math.round((likedCount / T.length) * 100), 8, 100) : 8;
  const quick = take(8);
  const speed = take(11, 5);
  const daily = take(6, 2);
  const covers = take(8, 4);
  const trending = take(8, 1);
  const recent = recentTracks().slice(0, 8);

  const status = server.connected
    ? `<span class="status"><i></i>Dropbox ${esc(server.folder)} • ${T.length} song${T.length === 1 ? '' : 's'}${DB.syncedAt ? ` • synced ${timeAgo(DB.syncedAt)}` : ''}</span>`
    : `<span class="status warn"><i></i>${esc(syncError || 'Dropbox not connected')}</span>`;

  el.innerHTML = `<div class="top"><div class="brand"><span class="lg">${I('play', 1)}</span><b>bloud</b></div>
    <div class="tr"><button class="ic bell" id="syncBtn" aria-label="Sync">${I('refresh')}${syncing ? '<i>·</i>' : ''}</button>
    <div id="avBtn" style="cursor:pointer">${art(T[i] || null, 'c av')}</div></div></div>

  <div class="hs">${chips.map((c) => `<button class="chip${homeCat === c ? ' on' : ''}" data-hcat="${esc(c)}">${esc(c)}</button>`).join('')}</div>

  ${recent.length ? `<div class="lab" style="margin:18px 0 8px;color:var(--mu);font-size:13px">Jump back in</div>
    <div class="hs">${recent.slice(0, 6).map((tr) => `<div class="rec" data-k="${T.indexOf(tr)}">${art(tr)}<b>${esc(tr.name)}</b></div>`).join('')}</div>` : ''}

  ${sec('Quick picks', quick)}${cols(quick)}

  <div class="who">${art(T[0], 'c av')}<div><small>FOR YOU</small><h2>Speed dial</h2></div></div>
  <div class="hs snap" id="dial">
    <div class="pg">
      <div class="tile lk" id="likedTile" style="--lk-p:${lkPct}%"><span>${I('thumb', 1)}</span><u></u><b>Liked music</b></div>
      ${speed.slice(0, 5).map(tile).join('')}
    </div>
    ${speed.length > 5 ? `<div class="pg">${speed.slice(5).map(tile).join('')}</div>` : ''}
  </div>
  <div class="pd"><i class="on" data-page="0"></i>${speed.length > 5 ? '<i data-page="1"></i>' : ''}</div>

  ${sec('Your daily discover', daily)}<div class="hs snap">${daily.slice(0, 3).map(disc).join('')}</div>
  ${sec('Covers and remixes', covers)}${cols(covers.slice(0, 4))}
  ${sec('Trending in your library', trending)}${cols(trending.slice(0, 4))}
  ${server.connected ? '' : setupCard()}
  <p class="note">${status}</p>`;

  const dl = $('#dial');
  if (dl) dl.onscroll = () => {
    const n = Math.round(dl.scrollLeft / Math.max(1, dl.clientWidth));
    $$('.pd i').forEach((x, k) => x.classList.toggle('on', k === n));
  };
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/* ── search ──────────────────────────────────────────────────────────────── */
function renderSearch() {
  const el = $('#search');
  if (!el) return;
  const qVal = $('#q')?.value || '';
  const recents = recentTracks().slice(0, 8);
  const history = (DB.searchHist || []).slice(0, 8);

  el.innerHTML = `<div class="sbar"><div class="sb">
      <button class="ic" id="sBack">${I('back')}</button>
      <input id="q" value="${esc(qVal)}" placeholder="Songs, artists, folders" autocomplete="off" enterkeyhint="search">
      <button class="ic" id="sMic">${I('mic')}</button>
    </div><button class="wv" id="sWave">${I('wave')}</button></div>
    <div id="rec">
      ${recents.length ? `<div class="lab">Recent</div><div class="hs">${recents.map((tr) => `<div class="rec" data-k="${T.indexOf(tr)}">${art(tr)}<b>${esc(tr.name)}</b></div>`).join('')}</div>` : ''}
      ${history.length ? history.map((h) => `<div class="hist" data-hq="${esc(h)}">${I('history')}<span>${esc(h)}</span><button class="ic" data-fill="${esc(h)}">${I('upleft')}</button></div>`).join('') : ''}
      <div class="cats">
        <div class="cat" id="catNew">${I('disc')}New releases</div>
        <div class="cat" id="catCharts">${I('trend')}Most played</div>
      </div>
    </div><div id="res"></div>`;

  const inp = $('#q');
  const runSearch = (v) => {
    const term = v.trim().toLowerCase();
    $('#rec').style.display = term ? 'none' : '';
    if (!term) { $('#res').innerHTML = ''; return; }
    const hits = T.filter((tr) =>
      `${tr.name} ${tr.artist} ${tr.album} ${tr.folder} ${tr.genre}`.toLowerCase().includes(term));
    $('#res').innerHTML = hits.length
      ? hits.map(row).join('')
      : `<div class="empty">No matches in your library.<br><span style="font-size:13px">Try another spelling, or sync again.</span></div>`;
  };
  inp.oninput = (e) => runSearch(e.target.value);
  inp.onkeydown = (e) => {
    if (e.key !== 'Enter') return;
    const v = inp.value.trim();
    if (!v) return;
    DB.searchHist = uniq([v, ...(DB.searchHist || [])]).slice(0, 10);
    saveLocal(); pushDB();
  };
  if (qVal) runSearch(qVal);
  else if (!T.length) $('#rec').innerHTML = `<div class="empty">Sync your Dropbox folder to start searching.</div>`;
}

/* ── library ─────────────────────────────────────────────────────────────── */
function renderLibrary() {
  const el = $('#library');
  if (!el) return;
  const likedCount = likedTracks().length;
  const artistsList = artists();
  const albumsList = albums();
  let songs = [...T];
  if (libSort === 1) songs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  else if (libSort === 2) songs.sort((a, b) => a.artist.localeCompare(b.artist) || a.name.localeCompare(b.name));
  else if (libSort === 3) songs.sort((a, b) => (b.modified || '').localeCompare(a.modified || ''));

  let body = '';
  if (libCat === 'Downloads') {
    const dl = downloadedTracks();
    body = dl.length ? dl.map(row).join('')
      : `<div class="empty" style="padding:70px 0">No downloads yet.<br><span style="font-size:13px">Open a song → Download to keep it offline.</span></div>`;
  } else if (libCat === 'Songs') {
    body = songs.length ? songs.map(row).join('') : `<div class="empty" style="padding:70px 0">No songs synced yet.</div>`;
  } else if (libCat === 'Podcasts') {
    const pods = T.filter((tr) => /podcast/i.test(tr.folder || '') || tr.dur > 900);
    body = pods.length ? pods.map(row).join('')
      : `<div class="empty" style="padding:70px 0">No long-form audio found.<br><span style="font-size:13px">Make a “Podcasts” folder in ${esc(server.folder)}.</span></div>`;
  } else if (libCat === 'Artists') {
    body = artistsList.length ? `<div class="grid2">${artistsList.map((a) =>
      `<div class="gcard" data-artist="${esc(a.name)}"><div class="art c" style="${artStyle(a.tracks[0])}"></div>
        <b>${esc(a.name)}</b><span>Artist • ${a.tracks.length} song${a.tracks.length === 1 ? '' : 's'}</span></div>`).join('')}</div>`
      : `<div class="empty" style="padding:70px 0">No artists yet.</div>`;
  } else if (libCat === 'Albums') {
    body = albumsList.length ? `<div class="grid2">${albumsList.map((al) =>
      `<div class="gcard" data-album="${esc(al.name)}\u0000${esc(al.artist)}">${art(al.tracks[0])}
        <b>${esc(al.name)}</b><span>${esc(al.artist)} • ${al.tracks.length} song${al.tracks.length === 1 ? '' : 's'}</span></div>`).join('')}</div>`
      : `<div class="empty" style="padding:70px 0">No albums yet.</div>`;
  } else {
    // Playlists (default)
    const pls = allPlaylists();
    body = `<div class="lrow" id="libLiked"><div class="liked">${I('thumb', 1)}</div>
      <div class="meta"><b>Liked music</b><span>Auto playlist • ${likedCount} song${likedCount === 1 ? '' : 's'}</span></div>
      <button class="ic" id="libLikedPlay">${I('dots', 1)}</button></div>
      ${pls.length ? pls.map((pl) => {
        const list = tracksForIds(pl.tracks);
        const n = list.length;
        /* Stored id lists keep ids of deleted files, so count what is playable.
           A one-song playlist must not repeat that one cover four times. */
        const cover = !n
          ? `<div class="collage empty-collage"><div class="art" style="--h:220"></div></div>`
          : n < 4
            ? `<div class="collage single">${art(list[0])}</div>`
            : `<div class="collage">${[0, 1, 2, 3].map((j) => art(list[j])).join('')}</div>`;
        return `<div class="lrow" data-pl="${esc(pl.id)}">${cover}
          <div class="meta"><b>${esc(pl.name)}</b><span>${pl.auto ? ck : ''}${pl.auto ? 'Folder' : 'Playlist'} • ${n} song${n === 1 ? '' : 's'}</span></div>
          <button class="ic" data-plmenu="${esc(pl.id)}">${I('dots', 1)}</button></div>`;
      }).join('') : `<div class="empty" style="padding:50px 0">No playlists yet.<br><span style="font-size:13px">Make a subfolder in ${esc(server.folder)} or tap New.</span></div>`}`;
  }

  el.innerHTML = `<div class="lt"><h1>Library</h1><div class="tr">
      <button class="ic" id="libHistBtn">${I('history')}</button>
      <button class="ic" id="libSearchBtn">${I('search')}</button>
      <div id="libAvBtn" style="cursor:pointer">${art(T[i] || null, 'c av')}</div></div></div>
    <div class="hs lc">${['Playlists', 'Songs', 'Artists', 'Albums', 'Downloads', 'Podcasts'].map((c) =>
      `<button class="chip${libCat === c ? ' on' : ''}" data-lcat="${c}">${c}</button>`).join('')}</div>
    <div class="sort"><span id="sortBtn">${SORTS[libSort]} ${I('chev')}</span>
      <span id="libSyncQuick" style="cursor:pointer;display:flex;align-items:center;gap:8px">${I('refresh')} Sync</span></div>
    ${body}`;
}

/* ── global refresh entry points ─────────────────────────────────────────── */
function renderAll() { renderHome(); renderSearch(); renderLibrary(); updateBadges(); }
function renderRefreshState() {
  const btn = $('#syncBtn');
  if (btn) btn.style.opacity = syncing ? '.5' : '';
  renderHome();
}
/* ═══════════════════════════════════════════════════════════════════════════
   playback — audio engine, queue, media session, lyrics, visualiser
   ═══════════════════════════════════════════════════════════════════════════ */

const audio = new Audio();
audio.preload = 'auto';
audio.crossOrigin = null;      // never set: it breaks plain Dropbox links
audio.preload = 'metadata';
const vid = () => $('#vid');

/* ── queue ───────────────────────────────────────────────────────────────── */
function setQueue(tracks, startTrack) {
  queue = tracks.filter(Boolean);
  if (!queue.length) queue = [...T];
  const pos = queue.findIndex((x) => x.id === startTrack?.id);
  qPos = pos >= 0 ? pos : 0;
}

/** Play a track by its index in T, optionally with an explicit queue. */
function play(k, customQueue) {
  if (k < 0 || k >= T.length) return;
  if (i !== k) playHist.push(i);
  i = k; t = 0;
  if (customQueue && customQueue.length) setQueue(customQueue, T[k]);
  else if (!queue.some((x) => x.id === T[k].id)) setQueue(T, T[k]);
  else qPos = queue.findIndex((x) => x.id === T[k].id);
  loadTrackUI();
  playCurrent();
}

function go(dir) {
  if (!T.length) return;
  if (dir < 0 && playHist.length && !shuffleOn) {
    i = playHist.pop(); t = 0; loadTrackUI(); playCurrent(); return;
  }
  playHist.push(i);
  if (shuffleOn && queue.length > 1) {
    let n = i;
    while (n === i) n = Math.floor(Math.random() * T.length);
    i = n;
  } else if (queue.length) {
    qPos = (qPos + dir + queue.length) % queue.length;
    const found = T.findIndex((x) => x.id === queue[qPos].id);
    i = found >= 0 ? found : (i + dir + T.length) % T.length;
  } else {
    i = (i + dir + T.length) % T.length;
  }
  t = 0; loadTrackUI(); playCurrent();
}

function onTrackEnded() {
  if (repeatMode === 2) { t = 0; audio.currentTime = 0; playCurrent(); return; }
  const atEnd = qPos >= queue.length - 1;
  if (atEnd && repeatMode !== 1 && !shuffleOn) {
    playing = false; t = 0; ppIcons(); paint(); return;
  }
  go(1);
}

/* ── stream loading ──────────────────────────────────────────────────────── */
async function playCurrent() {
  const tr = T[i];
  if (!tr) return;
  stopDemoClock();
  if (activeBlobUrl) { URL.revokeObjectURL(activeBlobUrl); activeBlobUrl = ''; }
  audio.pause();
  if (vid()) vid().pause();

  hasPlayed = true;
  const miniEl = $('#mini');
  if (miniEl) miniEl.hidden = false;
  DB.recentIds = uniq([tr.id, ...(DB.recentIds || [])]).slice(0, 30);
  DB.playCounts[tr.id] = (DB.playCounts[tr.id] || 0) + 1;
  if (!DB.firstPlay[tr.id]) DB.firstPlay[tr.id] = new Date().toISOString();
  DB.lastPlayed = Date.now();
  saveLocal();
  queueMicrotask(() => pushDB());

  if (tr.demo) { playing = true; ppIcons(); startDemoClock(); updateMediaSession(); return; }

  playing = true; ppIcons();
  try {
    const blob = await IDB.get('audio', tr.id);
    if (blob) {
      activeBlobUrl = URL.createObjectURL(blob);
      audio.src = activeBlobUrl;
      if (tr.isVideo && vid()) { vid().src = activeBlobUrl; }
    } else {
      if (!server.connected && !DB.prefs.offlineMode) throw new Error('NOT_CONNECTED');
      const url = Api.streamUrl(tr.path);
      audio.src = url;
      if (tr.isVideo && vid()) vid().src = url;
    }
    audio.currentTime = t || 0;
    await audio.play();
    updateMediaSession();
    // warm the next track's URL so skips feel instant
    const nextTr = T[(i + 1) % T.length];
    if (nextTr && !nextTr.demo) fetch(Api.streamUrl(nextTr.path), { method: 'HEAD' }).catch(() => {});
  } catch (e) {
    playing = false; ppIcons();
    if (e && e.name === 'NotAllowedError') toast('Tap play to start audio');
    else if (String(e.message || e) === 'NOT_CONNECTED') toast('Offline — only downloaded songs play');
    else toast('Could not play this file');
  }
}

function togglePlay() {
  const tr = T[i];
  if (!tr) return;
  if (playing) {
    playing = false;
    if (tr.demo) stopDemoClock(); else { audio.pause(); vid()?.pause(); }
    ppIcons();
  } else if (tr.demo) {
    playing = true; ppIcons(); startDemoClock();
  } else if (audio.src) {
    audio.play().then(() => { playing = true; ppIcons(); }).catch(() => playCurrent());
  } else {
    playCurrent();
  }
}

/* audio events */
audio.addEventListener('timeupdate', () => {
  if (!isSeeking && !T[i]?.demo) { t = audio.currentTime || 0; paint(); }
});
audio.addEventListener('loadedmetadata', () => {
  if (audio.duration && isFinite(audio.duration) && T[i]) {
    T[i].dur = Math.round(audio.duration);
    const cached = DB.library.find((x) => x.id === T[i].id);
    if (cached) cached.dur = T[i].dur;
    saveLocal(); paint();
  }
});
audio.addEventListener('ended', onTrackEnded);
audio.addEventListener('play', () => { playing = true; ppIcons(); updateMediaSession(); });
audio.addEventListener('pause', () => { if (!T[i]?.demo) { playing = false; ppIcons(); } });
audio.addEventListener('error', () => {
  if (T[i]?.demo || !playing) return;
  toast('Stream hiccup — retrying');
  setTimeout(() => { audio.src = Api.streamUrl(T[i].path); audio.play().catch(() => {}); }, 800);
});
audio.addEventListener('waiting', () => { const m = $('#mini'); if (m) m.style.opacity = '.6'; });
audio.addEventListener('playing', () => { const m = $('#mini'); if (m) m.style.opacity = ''; });

/* demo clock (only used by the built-in demo songs) */
function stopDemoClock() { if (demoTimer) { clearInterval(demoTimer); demoTimer = null; } }
function startDemoClock() {
  stopDemoClock();
  demoTimer = setInterval(() => {
    if (!playing) return;
    t += 0.25;
    if (t >= (T[i]?.dur || 200)) onTrackEnded(); else paint();
  }, 250);
}

/* ── media session ───────────────────────────────────────────────────────── */
function updateMediaSession() {
  const tr = T[i];
  if (!tr || !('mediaSession' in navigator)) return;
  try {
    const artUrl = coverUrl(tr) || tr.coverData || '';
    navigator.mediaSession.metadata = new MediaMetadata({
      title: tr.name, artist: tr.artist, album: tr.album || 'bloud',
      artwork: artUrl ? [{ src: artUrl, sizes: '512x512', type: 'image/jpeg' }] : [],
    });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    const set = (a, fn) => { try { navigator.mediaSession.setActionHandler(a, fn); } catch {} };
    set('play', () => { if (!playing) togglePlay(); });
    set('pause', () => { if (playing) togglePlay(); });
    set('previoustrack', () => go(-1));
    set('nexttrack', () => go(1));
    set('seekto', (d) => { if (d.seekTime != null) { t = d.seekTime; audio.currentTime = t; paint(); } });
    set('seekbackward', (d) => { t = Math.max(0, t - (d.seekOffset || 10)); audio.currentTime = t; paint(); });
    set('seekforward', (d) => { t = Math.min(T[i].dur || t + 10, t + (d.seekOffset || 10)); audio.currentTime = t; paint(); });
  } catch {}
}

/* ── UI sync ─────────────────────────────────────────────────────────────── */
function ppIcons() {
  $$('.pp').forEach((b) => {
    const svg = b.querySelector('svg');
    const html = I(playing ? 'pause' : 'play', 1);
    if (svg) svg.outerHTML = html; else b.insertAdjacentHTML('afterbegin', html);
  });
  $('#full')?.classList.toggle('paused', !playing);
}

function applyCoverArt(el, tr) {
  if (!el || !tr) return;
  el.style.setProperty('--h', tr.hue);
  if (tr.coverPath || tr.coverData) {
    el.classList.add('has-img');
    el.style.setProperty('--img', `url('${coverUrl(tr) || tr.coverData}')`);
  } else {
    el.classList.remove('has-img');
    el.style.removeProperty('--img');
  }
}

function loadTrackUI(scrollSheet = true) {
  const tr = T[i];
  if (!tr) return;
  document.documentElement.style.setProperty('--h', tr.hue || 200);
  $$('.tt').forEach((e) => (e.textContent = tr.name));
  $$('.aa').forEach((e) => (e.textContent = tr.artist));
  applyCoverArt($('#mArt'), tr);
  applyCoverArt($('#sArt'), tr);
  applyCoverArt($('#fArt'), tr);
  const fArt = $('#fArt');
  if (fArt) fArt.innerHTML = (tr.coverPath || tr.coverData) ? '' : `<b>${esc(tr.name)}</b>`;
  const mix = $('#mix');
  if (mix) mix.textContent = `${tr.album || tr.folder || 'bloud'} mix`;
  const mini = $('#mini');
  // only surface the mini player once something has actually been played
  if (mini) mini.hidden = !(playing || audio.src || hasPlayed);
  updateBadges();
  $$('.row.playing').forEach((r) => r.classList.remove('playing'));
  $$(`.row[data-k="${T.indexOf(tr)}"]`).forEach((r) => r.classList.add('playing'));
  if (openSheet() && scrollSheet) sheetHTML();
  act = -2; paint(); ppIcons(); updateMediaSession();
}

function paint() {
  const tr = T[i];
  if (!tr) return;
  const dur = Math.max(1, tr.dur || 1);
  const f = clamp(t / dur, 0, 1);
  const bar = $('#bar');
  if (bar) bar.style.width = f * 100 + '%';
  if (!$('#full')?.classList.contains('open')) return;
  const seek = $('#seek');
  if (seek) seek.value = f * 1000;
  $('#sk')?.style.setProperty('--p', f * 100 + '%');
  const cur = $('#cur'), tot = $('#tot');
  if (cur) cur.textContent = fmt(t);
  if (tot) tot.textContent = fmt(dur);
  if (mode !== 'lyrics' || !tr.lyrics?.length) return;
  let j = -1;
  tr.lyrics.forEach((l, k) => { if (t >= l[0]) j = k; });
  if (j !== act) {
    act = j;
    $$('#sBody p').forEach((p) => p.classList.toggle('on', +p.dataset.j === j));
    const p = $('#sBody p.on'), body = $('#sBody');
    if (p && body) body.scrollTo({ top: p.offsetTop - body.clientHeight / 3, behavior: 'smooth' });
  }
}

/* ── lyrics ──────────────────────────────────────────────────────────────── */

/**
 * TTML clock → seconds. Values are "SS.mmm" under a minute and "M:SS.mmm"
 * beyond it (e.g. "1:00.895", "2:15.860"), so parseFloat is wrong — it reads
 * "1:00.895" as 1. Handles H:MM:SS too, just in case.
 */
function ttmlTime(v) {
  if (!v) return NaN;
  const parts = String(v).trim().split(':');
  if (parts.length === 1) return parseFloat(parts[0]);
  const last = parseFloat(parts.pop());
  if (Number.isNaN(last)) return NaN;
  let secs = last;
  if (parts.length) secs += parseInt(parts.pop(), 10) * 60;
  if (parts.length) secs += parseInt(parts.pop(), 10) * 3600;
  return secs;
}

/**
 * Apple's timed lyrics (.ttml) — what Stash ships next to each song.
 * Lyric lines are <p begin="12.5" end="15.1">…</p>; the display text is the
 * concatenation of the inner spans (which are per-word timing).
 * We prefer the transliterated (Latin) text when present, because the primary
 * text is often Devanagari and the rest of the UI is Latin — the .lrc alongside
 * it carries the native script, so this keeps both readable.
 */
function parseTtml(raw) {
  if (!raw || !/<tt[\s>]/.test(raw)) return null;
  const lines = [];
  const seen = new Set();
  const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = pRe.exec(raw)) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const t = (name) => {
      const r = new RegExp(name + '="([^"]+)"').exec(attrs);
      return r ? r[1] : '';
    };
    const begin = ttmlTime(t('begin'));
    const rawText = inner
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    if (!rawText || Number.isNaN(begin)) continue;
    const key = begin.toFixed(2) + rawText;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push([begin, rawText]);
  }
  if (!lines.length) return null;
  return { lines: lines.sort((a, b) => a[0] - b[0]), synced: true };
}

function parseLyrics(raw, duration) {
  if (!raw) return { lines: [], synced: false };
  // .ttml first: it is the higher-fidelity format when both are present
  const ttml = parseTtml(raw);
  if (ttml) return ttml;
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  const synced = [];
  const plain = [];
  raw.split(/\r?\n/).forEach((line) => {
    if (/^\s*\[(ti|ar|al|by|offset|re|ve):/i.test(line)) return;
    const times = [];
    let m; re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      times.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10) +
        (m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0));
    }
    const text = line.replace(re, '').trim();
    if (!text) return;
    if (times.length) times.forEach((ts) => synced.push([ts, text]));
    else plain.push(text);
  });
  if (synced.length) return { lines: synced.sort((a, b) => a[0] - b[0]), synced: true };
  if (!plain.length) return { lines: [], synced: false };
  // unsynced: spread lines evenly so they still scroll with the song
  const d = duration || 200;
  const step = Math.max(2.2, (d - 8) / Math.max(1, plain.length));
  return { lines: plain.map((text, k) => [Math.min(d - 2, 4 + k * step), text]), synced: false };
}

async function ensureLyrics(tr) {
  if (!tr || tr.lyrics) return tr?.lyrics;
  if (tr.lyricsPath && server.connected) {
    if (lrcCache.has(tr.lyricsPath)) { tr.lyrics = lrcCache.get(tr.lyricsPath); return tr.lyrics; }
    try {
      const res = await Api.text(tr.lyricsPath);
      if (res.text) {
        const parsed = parseLyrics(res.text, tr.dur);
        lrcCache.set(tr.lyricsPath, parsed);
        tr.lyrics = parsed;
        return parsed;
      }
    } catch {}
  }
  if (tr.plainLyrics) { tr.lyrics = parseLyrics(tr.plainLyrics, tr.dur); return tr.lyrics; }
  tr.lyrics = { lines: [], synced: false };
  return tr.lyrics;
}

/* ── visualiser ──────────────────────────────────────────────────────────── */
function drawVisualizer() {
  const cov = $('#cov'), cvs = $('#viz');
  if (!cov || !cvs) return;
  if (!cov.classList.contains('viz') || !$('#full')?.classList.contains('open')) return;
  const ctx = cvs.getContext('2d');
  const w = (cvs.width = cov.clientWidth * devicePixelRatio);
  const h = (cvs.height = cov.clientHeight * devicePixelRatio);
  ctx.clearRect(0, 0, w, h);
  const bars = 32, now = performance.now() / 220;
  ctx.fillStyle = 'rgba(255,255,255,.78)';
  for (let b = 0; b < bars; b++) {
    const amp = playing
      ? 0.2 + 0.65 * Math.abs(Math.sin(now + b * 0.45) * Math.cos(now * 0.7 - b * 0.2))
      : 0.12;
    const bh = h * 0.45 * amp, bw = (w / bars) * 0.55, x = b * (w / bars) + bw * 0.4;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, h - bh - 24, bw, bh, 6); else ctx.rect(x, h - bh - 24, bw, bh);
    ctx.fill();
  }
  vizRaf = requestAnimationFrame(drawVisualizer);
}
/* ═══════════════════════════════════════════════════════════════════════════
   actions — everything the user can do to their library
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── overlay history (Android back / swipe friendly) ─────────────────────── */
const openSheet = () => $('#sheet')?.classList.contains('open');
const modalOpen = () => $('#modal')?.classList.contains('open');
let hs = 0;
const push = () => { try { history.pushState({ b: 1 }, ''); hs++; } catch {} };
const popUI = () => {
  if (modalOpen()) $('#modal').classList.remove('open');
  else if (openSheet()) $('#sheet').classList.remove('open');
  else $('#full')?.classList.remove('open');
};
const back = () => { if (hs > 0) history.back(); else popUI(); };

function openModal(title, html) {
  if (!modalOpen()) push();
  $('#mTitle').textContent = title;
  $('#mBody').innerHTML = html;
  $('#modal').classList.add('open');
}
const closeModal = () => back();

/** Persist a user edit locally + to Dropbox. */
function commit({ playlist = true } = {}) {
  DB.localEditAt = Date.now();
  saveLocalNow();
  pushDB();
  updateBadges();
}

/* ── library entry points used from markup ───────────────────────────────── */
function openTrackMenu(k) {
  const tr = T[k];
  if (!tr) return;
  const liked = !!DB.liked[tr.id];
  const disliked = !!DB.disliked[tr.id];
  const off = offlineIds.has(tr.id);
  openModal(tr.name, `
    <div style="margin-top:-10px;color:var(--mu);font-size:13px">${esc(tr.artist)} • ${esc(tr.album || tr.folder || 'bloud')}${tr.dur ? ' • ' + fmt(tr.dur) : ''}</div>
    <button class="mact" data-act="playnext">${I('next', 1)}Play next</button>
    <button class="mact" data-act="queue">${I('queue')}Add to queue</button>
    <button class="mact" data-act="like">${I('thumb', 1)}${liked ? 'Remove from Liked music' : 'Add to Liked music'}</button>
    <button class="mact" data-act="dislike">${I('thumb', 1)}${disliked ? 'Remove dislike' : 'Not interested'}</button>
    <button class="mact" data-act="playlist">${I('plus')}Add to playlist</button>
    <button class="mact" data-act="download">${I('download')}${off ? 'Remove download' : 'Download for offline'}</button>
    <button class="mact" data-act="share">${I('share')}Share</button>
    <button class="mact" data-act="info">${I('info')}File details</button>
    <div style="font-size:11px;color:var(--mu);padding:4px 8px;word-break:break-all">${esc(tr.path)}</div>`);

  $$('#mBody [data-act]').forEach((btn) => {
    btn.onclick = async () => {
      const act = btn.dataset.act;
      if (act === 'playnext') {
        if (!queue.length) queue = [...T];
        queue.splice(qPos + 1, 0, tr);
        toast('Will play next');
      } else if (act === 'queue') {
        if (!queue.length) queue = [...T];
        queue.push(tr);
        toast('Added to queue');
      } else if (act === 'like') {
        DB.liked[tr.id] = !DB.liked[tr.id];
        if (DB.liked[tr.id]) delete DB.disliked[tr.id];
        commit(); renderAll();
        toast(DB.liked[tr.id] ? 'Added to Liked music' : 'Removed from Liked music');
      } else if (act === 'dislike') {
        DB.disliked[tr.id] = !DB.disliked[tr.id];
        if (DB.disliked[tr.id]) delete DB.liked[tr.id];
        commit(); renderAll();
        toast(DB.disliked[tr.id] ? 'We’ll play this less often' : 'Removed');
      } else if (act === 'playlist') { openSaveToPlaylist(tr); return; }
      else if (act === 'download') { closeModal(); toggleDownload(tr); return; }
      else if (act === 'share') { closeModal(); shareTrack(tr); return; }
      else if (act === 'info') { openTrackInfo(tr); return; }
      closeModal();
    };
  });
}

function openTrackInfo(tr) {
  const lines = [
    ['Title', tr.name], ['Artist', tr.artist], ['Album', tr.album || '—'],
    ['Folder', tr.folder || '—'], ['Track', tr.track || '—'],
    ['Duration', tr.dur ? fmt(tr.dur) : 'reads on play'],
    ['Size', tr.sizeLabel], ['Modified', tr.modified ? new Date(tr.modified).toLocaleString() : '—'],
    ['Plays', DB.playCounts[tr.id] || 0],
    ['Dropbox path', tr.path],
  ];
  openModal('File details', `
    <div class="mlist">
      ${lines.map(([k2, v]) => `<div class="mrow" style="border-bottom:1px solid #ffffff12"><span style="color:var(--mu)">${esc(k2)}</span><span style="text-align:right;max-width:60%;word-break:break-word">${esc(v)}</span></div>`).join('')}
    </div>
    <button class="mbtn sec" id="copyPath">Copy Dropbox path</button>`);
  $('#copyPath').onclick = async () => {
    try { await navigator.clipboard.writeText(tr.path); toast('Path copied'); }
    catch { toast(tr.path, 4000); }
  };
}

function openSaveToPlaylist(tr) {
  const manual = (DB.playlists || []);
  openModal('Save to playlist', `
    ${manual.length ? manual.map((pl) => `<button class="mpl" data-addpl="${esc(pl.id)}">
        <div class="art" style="--h:${hashHue(pl.name)}"></div>
        <div><b>${esc(pl.name)}</b><small>${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}</small></div>
        <span style="color:var(--mu)">${pl.tracks.includes(tr.id) ? I('check') : I('plus')}</span>
      </button>`).join('') : ''}
    <button class="mbtn" id="newPlInline">${I('plus')}New playlist</button>`);

  $$('[data-addpl]').forEach((btn) => {
    btn.onclick = () => {
      const pl = DB.playlists.find((x) => x.id === btn.dataset.addpl);
      if (!pl) return;
      if (pl.tracks.includes(tr.id)) {
        pl.tracks = pl.tracks.filter((x) => x !== tr.id);
        toast(`Removed from ${pl.name}`);
      } else {
        pl.tracks.push(tr.id);
        toast(`Saved to ${pl.name}`);
      }
      pl.updatedAt = Date.now();
      commit(); renderLibrary(); closeModal();
    };
  });
  $('#newPlInline').onclick = () => openNewPlaylist(tr);
}

function openNewPlaylist(firstTrack) {
  openModal('New playlist', `
    <label class="fld">Playlist name
      <input id="plNameInput" placeholder="e.g. Goa night drive" autofocus></label>
    <button class="mbtn" id="createPlBtn">Create</button>`);
  const create = () => {
    const name = ($('#plNameInput').value || '').trim();
    if (!name) { toast('Enter a name'); return; }
    const pl = {
      id: 'pl_' + Date.now().toString(36),
      name, tracks: firstTrack ? [firstTrack.id] : [],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    DB.playlists.unshift(pl);
    commit(); renderLibrary(); closeModal();
    toast(`Created “${name}”`);
  };
  $('#createPlBtn').onclick = create;
  $('#plNameInput').onkeydown = (e) => { if (e.key === 'Enter') create(); };
}

function openPlaylistMenu(plId) {
  const pl = allPlaylists().find((p) => p.id === plId);
  if (!pl) return;
  const tracks = tracksForIds(pl.tracks);
  openModal(pl.name, `
    <div style="margin-top:-10px;color:var(--mu);font-size:13px">${pl.auto ? 'Folder in ' + server.folder : 'Playlist'} • ${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}</div>
    <button class="mact" data-plact="play">${I('play', 1)}Play all</button>
    <button class="mact" data-plact="shuffle">${I('shuffle')}Shuffle play</button>
    <button class="mact" data-plact="queue">${I('queue')}Add all to queue</button>
    ${pl.auto ? '' : `<button class="mact" data-plact="rename">${I('save')}Rename</button>
      <button class="mact" data-plact="delete" style="color:#ff4e6a">${I('trash')}Delete playlist</button>`}
    <div style="margin-top:8px">${tracks.slice(0, 50).map(row).join('')}</div>`);

  $$('#mBody [data-plact]').forEach((b) => {
    b.onclick = () => {
      const a = b.dataset.plact;
      if (a === 'play') { closeModal(); if (tracks.length) play(T.indexOf(tracks[0]), tracks); }
      else if (a === 'shuffle') {
        shuffleOn = true; DB.ui.shuffle = true; saveLocal();
        closeModal(); if (tracks.length) play(T.indexOf(tracks[0]), tracks);
        toast('Shuffle on');
      } else if (a === 'queue') {
        queue = [...tracks]; qPos = 0; closeModal(); toast('Queued ' + tracks.length + ' songs');
      } else if (a === 'rename') {
        openModal('Rename playlist', `<label class="fld">New name
          <input id="plRename" value="${esc(pl.name)}"></label>
          <button class="mbtn" id="plRenameBtn">Save</button>`);
        $('#plRenameBtn').onclick = () => {
          const v = ($('#plRename').value || '').trim();
          const target = DB.playlists.find((x) => x.id === pl.id);
          if (target && v) { target.name = v; target.updatedAt = Date.now(); commit(); renderLibrary(); }
          closeModal(); toast('Renamed');
        };
      } else if (a === 'delete') {
        DB.playlists = DB.playlists.filter((x) => x.id !== pl.id);
        commit(); renderLibrary(); closeModal(); toast('Playlist deleted');
      }
    };
  });
}

function openArtist(name) {
  const tracks = T.filter((tr) => (tr.artist || 'Unknown artist') === name);
  openTrackList(name, tracks, 'Artist');
}
function openAlbum(name, artist) {
  const tracks = T.filter((tr) => (tr.album || tr.folder || 'Singles') === name && (!artist || tr.artist === artist));
  openTrackList(name, tracks, artist);
}

function openTrackList(title, tracks, sub) {
  openModal(title, `
    ${sub ? `<div style="margin-top:-10px;color:var(--mu);font-size:13px">${esc(sub)} • ${tracks.length} song${tracks.length === 1 ? '' : 's'}</div>` : ''}
    ${tracks.length ? `<button class="mbtn" id="modalPlayAll">${I('play', 1)}Play all</button>
      <button class="mbtn sec" id="modalShuffle">${I('shuffle')}Shuffle</button>` : ''}
    <div>${tracks.length ? tracks.map(row).join('') : '<div class="empty" style="padding:40px 0">Nothing here.</div>'}</div>`);
  const pa = $('#modalPlayAll');
  if (pa) pa.onclick = () => { closeModal(); play(T.indexOf(tracks[0]), tracks); };
  const sh = $('#modalShuffle');
  if (sh) sh.onclick = () => {
    shuffleOn = true; DB.ui.shuffle = true; saveLocal();
    closeModal(); play(T.indexOf(tracks[0]), tracks); toast('Shuffle on');
  };
}

/* ── offline downloads ───────────────────────────────────────────────────── */
async function toggleDownload(tr) {
  if (!tr) return;
  if (offlineIds.has(tr.id)) {
    await IDB.del('audio', tr.id);
    offlineIds.delete(tr.id);
    updateBadges(); renderLibrary();
    toast('Removed download');
    return;
  }
  if (tr.demo) { offlineIds.add(tr.id); updateBadges(); toast('Saved'); return; }
  if (!server.connected) { toast('Connect Dropbox to download'); return; }
  toast(`Downloading “${tr.name}”…`, 6000);
  try {
    const res = await fetch(Api.streamUrl(tr.path));
    if (!res.ok) throw new Error('bad response');
    const blob = await res.blob();
    if (blob.size < 2048) throw new Error('empty file');
    await IDB.put('audio', tr.id, blob);
    offlineIds.add(tr.id);
    updateBadges(); renderLibrary();
    toast(`Saved for offline (${fmtSize(blob.size)})`);
  } catch (e) {
    toast('Download failed — try again');
  }
}

/** Cache whole visible library for offline (used from Settings). */
async function downloadAll() {
  const list = T.filter((tr) => !tr.demo && !offlineIds.has(tr.id));
  if (!list.length) { toast('Everything is already downloaded'); return; }
  if (!confirm(`Download ${list.length} songs for offline use? This uses device storage.`)) return;
  let done = 0;
  for (const tr of list) {
    try {
      const res = await fetch(Api.streamUrl(tr.path));
      if (!res.ok) continue;
      const blob = await res.blob();
      await IDB.put('audio', tr.id, blob);
      offlineIds.add(tr.id);
      done++;
      toast(`Downloading ${done}/${list.length}…`, 1200);
      renderLibrary();
    } catch {}
  }
  updateBadges(); renderLibrary();
  toast(`Downloaded ${done} of ${list.length} songs`);
}

async function offlineUsage() {
  const d = await IDB.open();
  if (!d) return { count: 0, bytes: 0 };
  return new Promise((resolve) => {
    let count = 0, bytes = 0;
    const tx = d.transaction('audio', 'readonly');
    const cur = tx.objectStore('audio').openCursor();
    cur.onsuccess = (e) => {
      const c = e.target.result;
      if (c) { count++; bytes += c.value?.size || 0; c.continue(); }
      else resolve({ count, bytes });
    };
    cur.onerror = () => resolve({ count: 0, bytes: 0 });
  });
}

/* ── upload a file from this device into /bloud ──────────────────────────── */
function pickUpload() {
  if (!server.connected) { toast('Connect Dropbox first'); return; }
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'audio/*,video/*';
  inp.multiple = true;
  inp.onchange = async () => {
    const files = [...(inp.files || [])];
    if (!files.length) return;
    for (const f of files) {
      if (f.size > 4.2 * 1024 * 1024) {
        toast(`${f.name} is over 4 MB — upload it from the Dropbox app instead`, 5000);
        continue;
      }
      toast(`Uploading ${f.name}…`, 8000);
      try {
        const res = await fetch('/api/upload?name=' + encodeURIComponent(f.name), {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: f,                       // raw bytes: the endpoint streams the body
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || 'upload failed');
        toast(`${f.name} uploaded`);
      } catch (e) { toast(`Upload failed: ${e.message}`, 4000); }
    }
    sync({ manual: true });
  };
  inp.click();
}

/* ── sharing ─────────────────────────────────────────────────────────────── */
async function shareTrack(tr) {
  if (!tr) return;
  const text = `${tr.name} — ${tr.artist} (bloud)`;
  const url = location.origin + '/';
  if (navigator.share) {
    try { await navigator.share({ title: tr.name, text, url }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast('Copied to clipboard'); }
  catch { toast(text); }
}

/* ── notes ───────────────────────────────────────────────────────────────── */
function openNotes(tr) {
  if (!tr) return;
  openModal('Song notes', `
    <label class="fld">Notes for “${esc(tr.name)}”
      <textarea id="noteTxt" rows="5" placeholder="Thoughts, timestamps, mood tags…">${esc(DB.notes[tr.id] || '')}</textarea></label>
    <button class="mbtn" id="saveNoteBtn">Save note</button>
    ${DB.notes[tr.id] ? '<button class="mbtn sec" id="delNoteBtn">Delete note</button>' : ''}`);
  $('#saveNoteBtn').onclick = () => {
    const v = ($('#noteTxt').value || '').trim();
    if (v) DB.notes[tr.id] = v; else delete DB.notes[tr.id];
    commit(); closeModal(); toast('Note saved');
  };
  const del = $('#delNoteBtn');
  if (del) del.onclick = () => { delete DB.notes[tr.id]; commit(); closeModal(); toast('Note deleted'); };
}

/* ── sheets (lyrics / queue) ─────────────────────────────────────────────── */
async function openSheetUI(m) {
  push(); mode = m;
  const tr = T[i];
  if (m === 'lyrics' && tr) {
    sheetHTML();
    $('#sheet').classList.add('open');
    const res = await ensureLyrics(tr);
    sheetHTML();
    if (res && !res.lines.length) toast('No lyrics — add a matching .lrc file');
    act = -2; paint();
    return;
  }
  sheetHTML();
  $('#sheet').classList.add('open');
  act = -2; paint();
}

function sheetHTML() {
  const tr = T[i];
  const body = $('#sBody');
  if (!body) return;
  $('#sTitle').textContent = mode === 'queue' ? 'Up next' : 'Lyrics';
  const shareBtn = $('#share');
  if (shareBtn) shareBtn.style.display = mode === 'queue' ? 'none' : '';
  if (mode === 'queue') {
    const list = queue.length ? queue : T;
    body.innerHTML = list.length
      ? list.map((x) => row(T.find((y) => y.id === x.id) || x)).join('')
      : '<p class="plain">Queue is empty.</p>';
    body.scrollTop = 0;
    return;
  }
  const lines = tr?.lyrics?.lines || [];
  body.innerHTML = lines.length
    ? `<p data-j="-1">♪</p>` + lines.map((l, j) => `<p data-j="${j}"${tr.lyrics.synced ? '' : ' class="plain"'}>${esc(l[1])}</p>`).join('')
    : `<p data-j="-1" class="on">♪</p><p class="plain">No lyrics for this song.<br>
        <span style="font-size:14px;font-weight:400;opacity:.75">Drop a file named exactly like the song — <code>${esc((tr?.path || 'song.mp3').split('/').pop().replace(/\.[^.]+$/, ''))}.lrc</code> — into ${esc(server.folder)}.</span></p>`;
  body.scrollTop = 0;
}

/* ── settings ────────────────────────────────────────────────────────────── */
async function openSettings() {
  const usage = await offlineUsage();
  const n = dbPayload();
  const connected = server.connected;
  openModal('Settings', `
    <div class="mrow" style="padding-top:0"><span>Dropbox
      <small>${connected ? esc(server.account?.name || 'Connected') + (server.account?.email ? ' • ' + esc(server.account.email) : '') : esc(syncError || 'Not connected')}</small></span>
      <span class="status ${connected ? '' : 'warn'}"><i></i></span></div>
    <div class="mrow"><span>Folder<small>${esc(server.folder)}${server.folderExists === false ? ' • does not exist yet' : ''}</small></span>
      <button class="pill-btn" id="setFolder">Change</button></div>
    <div class="mrow"><span>Songs<small>${T.length} in library • ${usage.count} downloaded (${fmtSize(usage.bytes)})</small></span>
      <button class="pill-btn" id="setSync">Sync</button></div>
    <div class="mrow"><span>Liked • playlists<small>${likedTracks().length} liked • ${(DB.playlists || []).length} playlist${(DB.playlists || []).length === 1 ? '' : 's'} • auto-saved to Dropbox</small></span>
      <button class="pill-btn" id="setPush">Back up</button></div>
    <div class="mrow"><span>Auto sync<small>Refresh library when you open the app</small></span>
      <div class="toggle ${DB.prefs.autoSync ? 'on' : ''}" id="tgAuto"></div></div>
    <div class="mrow"><span>Cache on device<small>Keep audio + art in this browser</small></span>
      <div class="toggle ${DB.prefs.cacheMedia ? 'on' : ''}" id="tgCache"></div></div>
    <div class="mrow"><span>Offline only<small>Play downloads without network</small></span>
      <div class="toggle ${DB.prefs.offlineMode ? 'on' : ''}" id="tgOffline"></div></div>
    ${connected ? `<button class="mbtn sec" id="setDownloadAll">${I('download')}Download all for offline</button>
      <button class="mbtn sec" id="setUpload">${I('plus')}Upload a song from this device</button>
      <button class="mbtn sec" id="setDisconnect" style="color:#ff4e6a">Disconnect Dropbox</button>`
      : `<a class="mbtn" href="/api/auth/start" style="text-decoration:none">${I('cloud')}Connect Dropbox</a>`}
    <p class="mnote">bloud v2 • Your songs stay in Dropbox. Likes, playlists and notes are written to
      <code>${esc(dbPath())}</code> so every device sees the same library.
      ${DB.syncedAt ? `Last sync ${timeAgo(DB.syncedAt)}.` : ''}</p>`);

  $('#setSync').onclick = () => { closeModal(); sync({ manual: true }); };
  $('#setPush').onclick = () => { pushDB({ now: true }); toast('Saved to Dropbox'); };
  $('#setFolder').onclick = () => {
    openModal('Music folder', `<label class="fld">Dropbox folder path
        <input id="folderInp" value="${esc(server.folder)}" placeholder="/bloud"></label>
      <p class="mnote">Must exist in your Dropbox and contain your audio files.</p>
      <button class="mbtn" id="folderSave">Save & sync</button>`);
    $('#folderSave').onclick = async () => {
      const v = ($('#folderInp').value || '').trim() || '/bloud';
      await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: v }),
      }).catch(() => {});
      server.folder = v;
      closeModal(); sync({ manual: true });
    };
  };
  const toggle = (el, key, after) => {
    if (!el) return;
    el.onclick = () => {
      DB.prefs[key] = !DB.prefs[key];
      el.classList.toggle('on', DB.prefs[key]);
      saveLocal();
      if (after) after();
    };
  };
  toggle($('#tgAuto'), 'autoSync');
  toggle($('#tgCache'), 'cacheMedia');
  toggle($('#tgOffline'), 'offlineMode', () => { document.body.classList.toggle('offline', DB.prefs.offlineMode); });
  const dl = $('#setDownloadAll'); if (dl) dl.onclick = () => { closeModal(); downloadAll(); };
  const up = $('#setUpload'); if (up) up.onclick = () => { closeModal(); pickUpload(); };
  const dc = $('#setDisconnect');
  if (dc) dc.onclick = async () => {
    if (!confirm('Disconnect Dropbox? Your files stay in Dropbox; this app just forgets the connection.')) return;
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    server.connected = false; syncError = 'Not connected';
    closeModal(); renderAll(); toast('Disconnected');
  };
  $$('#mBody .pill-btn').forEach((b) => (b.style.overflow = 'hidden'));
}

/* ── passcode gate (only when the server sets BLOUD_PASSCODE) ────────────── */
let gateShown = false;
function showPasscodeGate() {
  if (gateShown) return;
  gateShown = true;
  openModal('Enter passcode', `
    <p class="mnote" style="margin-top:-6px">This bloud library is private. Enter the passcode to unlock it.</p>
    <label class="fld">Passcode
      <input id="passIn" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••"></label>
    <button class="mbtn" id="passGo">Unlock</button>
    <p class="mnote" id="passErr" style="color:#ff4e6a"></p>`);
  const submit = async () => {
    const value = ($('#passIn').value || '').trim();
    if (!value) return;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: value }),
      });
      if (!res.ok) throw new Error();
      gateShown = false;
      closeModal();
      toast('Unlocked');
      await checkStatus({ silent: false });
      sync({ manual: false });
    } catch {
      $('#passErr').textContent = 'Wrong passcode — try again';
    }
  };
  $('#passGo').onclick = submit;
  $('#passIn').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
  setTimeout(() => $('#passIn')?.focus(), 300);
}

/* ── badges on the player ────────────────────────────────────────────────── */
function updateBadges() {
  const tr = T[i];
  const likeCount = likedTracks().length;
  const lkCnt = $('#lkCnt'); if (lkCnt) lkCnt.textContent = likeCount ? String(likeCount) : 'Like';
  const lk = $('#lk');
  if (lk && tr) {
    lk.classList.toggle('liked', !!DB.liked[tr.id]);
    lk.classList.toggle('disliked', !!DB.disliked[tr.id]);
  }
  const cmt = $('#cmtCnt'); if (cmt && tr) cmt.textContent = DB.notes[tr.id] ? '1' : 'Notes';
  const save = $('#saveBtn');
  if (save && tr) save.classList.toggle('saved', (DB.playlists || []).some((p) => p.tracks.includes(tr.id)));
  const dlt = $('#dlTxt'); if (dlt && tr) dlt.textContent = offlineIds.has(tr.id) ? 'Downloaded' : 'Download';
  $('#shuf')?.classList.toggle('on', shuffleOn);
  $('#rep')?.classList.toggle('on', repeatMode > 0);
  $('#rep')?.setAttribute('title', ['Repeat off', 'Repeat all', 'Repeat one'][repeatMode]);
}
/* ═══════════════════════════════════════════════════════════════════════════
   wire — delegated events, gestures, keyboard, boot
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── icons declared in markup ────────────────────────────────────────────── */
$$('[data-i]').forEach((e) => (e.innerHTML = I(e.dataset.i, e.dataset.f, e.dataset.c || '')));

/* ── global delegated clicks ─────────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const target = e.target;

  /* track "more" button */
  const dot = target.closest('[data-dot]');
  if (dot) { e.stopPropagation(); openTrackMenu(+dot.dataset.dot); return; }

  /* chips */
  const hcat = target.closest('[data-hcat]');
  if (hcat) { homeCat = homeCat === hcat.dataset.hcat ? '' : hcat.dataset.hcat; DB.ui.homeCat = homeCat; saveLocal(); renderHome(); return; }
  const lcat = target.closest('[data-lcat]');
  if (lcat) { libCat = lcat.dataset.lcat; DB.ui.libCat = libCat; saveLocal(); renderLibrary(); return; }

  /* play-all buttons built from markup */
  const pa = target.closest('[data-playlist-ids]');
  if (pa) {
    const ids = pa.dataset.playlistIds.split('|').filter(Boolean);
    const list = tracksForIds(ids);
    if (list.length) play(T.indexOf(list[0]), list);
    return;
  }

  /* paging dots */
  const pd = target.closest('.pd i[data-page]');
  if (pd) {
    const dl = $('#dial');
    if (dl) dl.scrollTo({ left: +pd.dataset.page * dl.clientWidth, behavior: 'smooth' });
    return;
  }

  /* header / sync affordances */
  if (target.closest('#syncBtn')) { sync({ manual: true }); return; }
  if (target.closest('#libSyncQuick')) { sync({ manual: true }); return; }
  if (target.closest('[data-sync]')) { sync({ manual: true }); return; }
  if (target.closest('#avBtn,#libAvBtn,#mSync,#fSync,#sSync,#setBtn')) { openSettings(); return; }
  if (target.closest('[data-open-settings]')) { openSettings(); return; }
  if (target.closest('[data-connect]')) {
    if (server.oauth === false) {
      toast('Dropbox is not configured yet — add DROPBOX_APP_KEY in Vercel and redeploy', 5000);
      return;
    }
    location.href = '/api/auth/start';
    return;
  }
  if (target.closest('[data-folder-upload]')) { pickUpload(); return; }

  /* liked / playlist rows */
  if (target.closest('#likedTile,#libLiked')) {
    openTrackList('Liked music', likedTracks(), 'Auto playlist');
    return;
  }
  const plMenu = target.closest('[data-plmenu]');
  if (plMenu) { e.stopPropagation(); openPlaylistMenu(plMenu.dataset.plmenu); return; }
  const plRow = target.closest('[data-pl]');
  if (plRow) {
    const pl = allPlaylists().find((p) => p.id === plRow.dataset.pl);
    if (pl) openTrackList(pl.name, tracksForIds(pl.tracks), pl.auto ? 'Folder' : 'Playlist');
    return;
  }
  const artistCard = target.closest('[data-artist]');
  if (artistCard) { openArtist(artistCard.dataset.artist); return; }
  const albumCard = target.closest('[data-album]');
  if (albumCard) {
    const [name, artist] = albumCard.dataset.album.split('\u0000');
    openAlbum(name, artist);
    return;
  }

  /* search helpers */
  const fill = target.closest('[data-fill]');
  if (fill) {
    e.stopPropagation();
    const inp = $('#q');
    if (inp) { inp.value = fill.dataset.fill; inp.focus(); inp.dispatchEvent(new Event('input')); }
    return;
  }
  const hist = target.closest('[data-hq]');
  if (hist) {
    const inp = $('#q');
    if (inp) { inp.value = hist.dataset.hq; inp.dispatchEvent(new Event('input')); }
    return;
  }
  if (target.closest('#sBack')) {
    const inp = $('#q');
    if (inp && inp.value) { inp.value = ''; inp.dispatchEvent(new Event('input')); }
    else switchTab('home');
    return;
  }
  if (target.closest('#sMic,#sWave')) { voiceSearch(); return; }
  if (target.closest('#catNew')) {
    const sorted = [...T].sort((a, b) => (b.modified || '').localeCompare(a.modified || ''));
    openTrackList('New releases', sorted, 'By date added');
    return;
  }
  if (target.closest('#catCharts')) {
    const sorted = [...T].sort((a, b) => (DB.playCounts[b.id] || 0) - (DB.playCounts[a.id] || 0));
    openTrackList('Most played', sorted, 'Your charts');
    return;
  }
  if (target.closest('#libSearchBtn')) { switchTab('search'); setTimeout(() => $('#q')?.focus(), 80); return; }
  if (target.closest('#libHistBtn')) {
    openTrackList('Recently played', recentTracks(), 'History');
    return;
  }
  if (target.closest('#sortBtn')) {
    libSort = (libSort + 1) % SORTS.length;
    DB.ui.sort = libSort; saveLocal(); renderLibrary();
    toast(SORTS[libSort]);
    return;
  }
  if (target.closest('#libLikedPlay')) { openPlaylistMenu('liked'); return; }

  /* no accidental row plays from buttons */
  if (target.closest('.dots')) return;

  /* row / tile / disc playback */
  const r = target.closest('[data-k]');
  if (r) {
    const k = +r.dataset.k;
    if (modalOpen()) back();
    const ctx = r.closest('#res, #rec');
    if (ctx) {
      // search results: queue = current filtered set
      const visible = $$('#res [data-k], #rec [data-k]').map((x) => T[+x.dataset.k]).filter(Boolean);
      play(k, uniq(visible));
    } else {
      play(k);
    }
    return;
  }
  const qRow = target.closest('#sBody [data-k]');
  if (qRow) { play(+qRow.dataset.k); return; }
}, { passive: true });

/* second listener for queue rows inside the sheet (they carry data-k too) */
$('#sBody').addEventListener('click', (e) => {
  const d = e.target.closest('[data-dot]');
  if (d) { e.stopPropagation(); openTrackMenu(+d.dataset.dot); }
});

/* ── voice search ────────────────────────────────────────────────────────── */
function voiceSearch() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Voice search is not supported in this browser'); return; }
  const rec = new SR();
  rec.lang = navigator.language || 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  $('#sWave')?.classList.add('listening');
  toast('Listening…');
  rec.onresult = (ev) => {
    const txt = ev.results[0]?.[0]?.transcript || '';
    const inp = $('#q');
    if (inp) { inp.value = txt; inp.dispatchEvent(new Event('input')); }
  };
  rec.onend = () => $('#sWave')?.classList.remove('listening');
  rec.onerror = () => { toast('Could not hear that'); $('#sWave')?.classList.remove('listening'); };
  try { rec.start(); } catch { toast('Microphone unavailable'); }
}

/* ── mini player + full player controls ──────────────────────────────────── */
$('#mini').onclick = (e) => {
  if (e.target.closest('button')) return;
  push(); $('#full').classList.add('open'); paint();
};
$('#mSync').onclick = (e) => { e.stopPropagation(); openSettings(); };
$('#fSync').onclick = () => openSettings();
$('#sSync').onclick = () => openSettings();
$$('.pp').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); togglePlay(); }));
$('#nx').onclick = () => go(1);
$('#pv').onclick = () => {
  if (t > 3) { t = 0; if (!T[i]?.demo) audio.currentTime = 0; paint(); }
  else go(-1);
};
$('#cl').onclick = back;
$('#sx').onclick = back;
$('#sRow').onclick = (e) => { if (!e.target.closest('button')) back(); };
$('#lyBtn').onclick = () => openSheetUI('lyrics');
$('#qh').onclick = () => openSheetUI('queue');
$('#fDots').onclick = () => openTrackMenu(i);
$('#fabNew').onclick = () => openNewPlaylist();
$('#artJump').onclick = () => { const tr = T[i]; if (tr) openArtist(tr.artist); };
$('#mx').onclick = back;
$('#modal').onclick = (e) => { if (e.target === $('#modal')) back(); };
window.addEventListener('popstate', () => { hs = Math.max(0, hs - 1); popUI(); });

/* audio/video segmented control */
$$('.seg button').forEach((btn) => (btn.onclick = () => {
  $$('.seg button').forEach((b) => b.classList.toggle('on', b === btn));
  const cov = $('#cov');
  const tr = T[i];
  if (btn.dataset.mode === 'video') {
    if (tr?.isVideo) {
      cov.classList.add('vid'); cov.classList.remove('viz');
      if (vid()) { vid().src = audio.src; vid().play().catch(() => {}); }
    } else {
      cov.classList.add('viz'); cov.classList.remove('vid');
      cancelAnimationFrame(vizRaf); drawVisualizer();
    }
  } else {
    cov.classList.remove('viz', 'vid');
    vid()?.pause();
    cancelAnimationFrame(vizRaf);
  }
}));

/* like / dislike pills */
$('#lk').onclick = (e) => {
  const tr = T[i]; if (!tr) return;
  if (e.target.closest('.rot')) {
    DB.disliked[tr.id] = !DB.disliked[tr.id];
    if (DB.disliked[tr.id]) { delete DB.liked[tr.id]; toast('Fewer songs like this'); go(1); }
    else toast('Removed');
  } else {
    DB.liked[tr.id] = !DB.liked[tr.id];
    if (DB.liked[tr.id]) delete DB.disliked[tr.id];
    toast(DB.liked[tr.id] ? 'Added to Liked music' : 'Removed from Liked music');
  }
  commit(); renderAll(); loadTrackUI();
};

$('#cmtBtn').onclick = () => openNotes(T[i]);
$('#saveBtn').onclick = () => { if (T[i]) openSaveToPlaylist(T[i]); };
$('#shPill').onclick = () => shareTrack(T[i]);
$('#share').onclick = () => shareTrack(T[i]);
$('#dlBtn').onclick = () => toggleDownload(T[i]);

$('#shuf').onclick = () => {
  shuffleOn = !shuffleOn;
  DB.ui.shuffle = shuffleOn; saveLocal();
  $('#shuf').classList.toggle('on', shuffleOn);
  toast(shuffleOn ? 'Shuffle on' : 'Shuffle off');
};
$('#rep').onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  DB.ui.repeat = repeatMode; saveLocal();
  $('#rep').classList.toggle('on', repeatMode > 0);
  toast(['Repeat off', 'Repeat all', 'Repeat one'][repeatMode]);
};

/* seek */
$('#seek').addEventListener('pointerdown', () => { isSeeking = true; });
$('#seek').addEventListener('pointerup', () => { isSeeking = false; });
$('#seek').oninput = (e) => {
  const tr = T[i]; if (!tr) return;
  t = (e.target.value / 1000) * (tr.dur || audio.duration || 1);
  if (!tr.demo && isFinite(audio.duration)) audio.currentTime = t;
  act = -2; paint();
};
$('#seek').onchange = () => { isSeeking = false; };

/* tap a lyric line to seek */
$('#sBody').addEventListener('click', (e) => {
  const p = e.target.closest('p');
  if (!p || mode !== 'lyrics') return;
  const tr = T[i];
  if (!tr?.lyrics?.synced) return;
  const j = +p.dataset.j;
  t = j < 0 ? 0 : tr.lyrics.lines[j][0];
  if (!tr.demo && isFinite(audio.duration)) audio.currentTime = t;
  act = -2; paint();
});

/* ── tabs ────────────────────────────────────────────────────────────────── */
function switchTab(v) {
  $$('nav button').forEach((x) => x.classList.toggle('on', x.dataset.v === v));
  $$('.view').forEach((s) => s.classList.toggle('on', s.id === v));
  document.body.dataset.v = v;
  scrollTo(0, 0);
}
$$('nav button').forEach((b) => (b.onclick = () => switchTab(b.dataset.v)));

/* ── ripple ──────────────────────────────────────────────────────────────── */
const RIPPLE = '.row,.lrow,.chip,.pill,.cat,.pa,.ic,.play,.fab,.share,.tile,.dc,nav button,.mact,.mbtn,.mpl,.gcard';
addEventListener('pointerdown', (e) => {
  let el = e.target.closest(RIPPLE);
  if (!el) return;
  if (el.matches('nav button')) el = el.firstElementChild;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height) * 2.2;
  const s = document.createElement('i');
  s.className = 'rp';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  el.appendChild(s);
  s.onanimationend = () => s.remove();
  setTimeout(() => s.remove(), 700);
  if (el.matches('.play,.ic,nav button>span') && navigator.vibrate) navigator.vibrate(8);
}, { passive: true });

/* ── swipe gestures ──────────────────────────────────────────────────────── */
let y0 = 0, sy0 = 0;
$('#full').addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
$('#full').addEventListener('touchend', (e) => {
  if (e.target.closest('.sheet,input,.pills,.sk')) return;
  if (e.changedTouches[0].clientY - y0 > 110) back();
});
$('#sheet').addEventListener('touchstart', (e) => { sy0 = e.touches[0].clientY; }, { passive: true });
$('#sheet').addEventListener('touchend', (e) => {
  if (e.target.closest('.sbody') && $('#sBody').scrollTop > 5) return;
  if (e.changedTouches[0].clientY - sy0 > 95) back();
});

/* ── keyboard ────────────────────────────────────────────────────────────── */
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea')) return;
  const tr = T[i];
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  else if (e.code === 'ArrowRight' && tr) { t = Math.min(tr.dur || t + 5, t + 5); if (!tr.demo) audio.currentTime = t; paint(); }
  else if (e.code === 'ArrowLeft' && tr) { t = Math.max(0, t - 5); if (!tr.demo) audio.currentTime = t; paint(); }
  else if (e.code === 'Escape') popUI();
  else if (e.code === 'KeyN' && e.shiftKey) go(1);
  else if (e.code === 'KeyP' && e.shiftKey) go(-1);
  else if (e.code === 'KeyL' && tr) { DB.liked[tr.id] = !DB.liked[tr.id]; commit(); renderAll(); loadTrackUI(); }
});

/* ── boot ────────────────────────────────────────────────────────────────── */
(async function boot() {
  // custom hooks can extend the API surface from /api/hooks
  try {
    const res = await fetch('/api/hooks');
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.connected !== undefined) server.connected = !!data.connected;
      if (data.serverFolder) server.folder = data.serverFolder;
      if (data.account) server.account = data.account;
      if (data.folderExists !== undefined) server.folderExists = data.folderExists;
      if (data.syncError) syncError = data.syncError;
      if (data.oauth === false) server.oauth = false;
      if (data.needsPasscode) { renderAll(); showPasscodeGate(); return; }
    }
  } catch {}

  // cached library first: instant paint, works offline
  try { offlineIds = new Set(await IDB.keys('audio')); } catch {}
  if (!T.length) T = hydrateCached();
  if (DB.ui.libCat) libCat = DB.ui.libCat;
  if (DB.ui.homeCat) homeCat = DB.ui.homeCat;
  libSort = DB.ui.sort | 0;
  const hadCache = T.length > 0;
  if (!T.length) T = [...DEMO];
  renderAll();
  loadTrackUI();
  document.body.classList.toggle('offline', !navigator.onLine || DB.prefs.offlineMode);

  const params = new URLSearchParams(location.search);
  if (params.get('connected')) {
    history.replaceState({}, '', '/');
    toast('Dropbox connected', 3000);
  }
  if (params.get('error')) {
    toast('Connection failed: ' + params.get('error'), 5000);
    history.replaceState({}, '', '/');
  }

  await checkStatus({ silent: false });
  if (T.every((x) => x.demo) && DB.library.length) T = hydrateCached();
  if (!T.length && !server.connected) T = [...DEMO];
  renderAll();
  /* re-attach artwork cached in IndexedDB so covers appear instantly on a
     cold start, before (or without) re-fetching any tags */
  hydrateCovers();
  if (server.connected && !T.some((x) => !x.demo)) {
    await sync({ manual: false });
  } else if (!server.connected && T.every((x) => x.demo)) {
    renderEmptyLibrary();
  }
  if (server.connected && DB.prefs.autoSync && Date.now() - (DB.syncedAt || 0) > 30000) {
    sync({ manual: false });
  }

  apiReady();
})();

/* re-sync when the app comes back to the foreground */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const stale = Date.now() - (DB.syncedAt || 0) > 120000;
  if (server.connected && DB.prefs.autoSync && stale && !syncing) sync({ manual: false });
});
addEventListener('online', () => { document.body.classList.remove('offline'); toast('Back online'); if (server.connected) sync({ manual: false }); });
addEventListener('offline', () => document.body.classList.add('offline'));

/* let other modules know boot finished */
function apiReady() {
  renderAll();
  if (T[i]) loadTrackUI();
}
