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
