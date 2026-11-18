/**
 * Mock Dropbox for local testing — a tiny stand-in for the real API so the
 * whole app (sync, tags, streaming, database round-trip) can be exercised
 * without credentials. Only used by scripts/dev-server.mjs when
 * BLOUD_MOCK=1 is set.
 */

const FOLDER = '/bloud';

const AUDIO = [
  ['/bloud/Sunset Drive/01 - Aria Vale - Neon Tides.mp3', 5120],
  ['/bloud/Sunset Drive/02 - The Lanterns - Paper Planes.mp3', 6400],
  ['/bloud/Sunset Drive/03 - Kiro - Golden Hour Loop.mp3', 7200],
  ['/bloud/Goa Night/01 - Mira Sol - Quiet Orbit.mp3', 8300],
  ['/bloud/Goa Night/02 - Atlas Crew - Run It Back.mp3', 4100],
  ['/bloud/Chill/Lowlight (Remix).mp3', 5900],
  ['/bloud/Chill/Harbor Lights.mp3', 6100],
  ['/bloud/Podcasts/Episode 12 - Deep Focus.mp3', 9600000],
  ['/bloud/Loose Track - No Folder.mp3', 4400],
];

/**
 * The layout the app is actually used with: one folder per song holding the
 * audio plus its sidecars.
 *   /bloud/Stash/<artist>/<album>/<song>.{m4a,lrc,ttml}
 * .m4a (not .mp3) and a .ttml are the interesting cases — the ttml holds
 * Apple-style timed lyrics and the m4a usually carries embedded cover art.
 */
const STASH = [
  {
    artist: 'gini', album: 'aashiyan', song: 'aashiyan',
    audio: { size: 7462798 }, lrc: { size: 2172 }, ttml: { size: 24907 },
  },
  {
    artist: 'john-michael-howell', album: 'queen-poet', song: 'queen-poet',
    audio: { size: 7552598 }, lrc: { size: 1944 }, ttml: { size: 17774 },
  },
  {
    artist: 'tame-impala', album: 'deadbeat', song: 'loser',
    audio: { size: 6100000 }, lrc: { size: 1600 }, ttml: null,
  },
];

function stashEntries() {
  const out = [];
  const folders = new Set();
  STASH.forEach((s) => {
    const base = `/bloud/Stash/${s.artist}/${s.album}`;
    folders.add('/bloud/Stash');
    folders.add(`/bloud/Stash/${s.artist}`);
    folders.add(base);
    const files = [[`${base}/${s.song}.m4a`, s.audio.size, 'audio']];
    if (s.lrc) files.push([`${base}/${s.song}.lrc`, s.lrc.size, 'lrc']);
    if (s.ttml) files.push([`${base}/${s.song}.ttml`, s.ttml.size, 'ttml']);
    files.forEach(([path, size], k) => {
      out.push({
        '.tag': 'file', name: path.split('/').pop(), id: `id:stash${s.song}${k}`,
        path_lower: path.toLowerCase(), path_display: path, size,
        server_modified: '2026-11-18T12:28:4' + k + 'Z', rev: `rev-stash-${s.song}-${k}`,
      });
    });
  });
  [...folders].forEach((f, k) => {
    out.push({
      '.tag': 'folder', name: f.split('/').pop(), id: `id:stashf${k}`,
      path_lower: f.toLowerCase(), path_display: f, size: 0,
      server_modified: '2026-11-18T12:00:00Z',
    });
  });
  return out;
}

/** Normalised to the same shape /api/dbx returns to the browser. */
function normalize(e, base = FOLDER) {
  if (e['.tag'] === 'folder') return { tag: 'folder', name: e.name, path: e.path_display, id: e.id, size: 0, modified: '', rev: '' };
  return {
    tag: e['.tag'], name: e.name, path: e.path_display, id: e.id,
    size: e.size || 0, modified: e.server_modified || '', rev: e.rev || '',
    rel: e.path_display.startsWith(base) ? e.path_display.slice(base.length).replace(/^\//, '') : e.path_display,
  };
}

const WITH_STASH = process.env.BLOUD_MOCK_STASH === '1';

export function mockEntries() {
  const entries = WITH_STASH ? [...stashEntries()] : [];
  const folders = new Set(['/bloud']);
  AUDIO.forEach(([path], idx) => {
    const parts = path.split('/');
    for (let d = 2; d < parts.length; d++) folders.add(parts.slice(0, d).join('/'));
    entries.push({
      '.tag': 'file', name: parts.pop(), id: 'id:mock' + idx, path_lower: path.toLowerCase(),
      path_display: path, size: AUDIO[idx][1], server_modified: '2026-11-1' + (idx % 9) + 'T10:00:00Z',
      rev: 'rev' + idx,
    });
  });
  entries.push({
    '.tag': 'file', name: 'cover.jpg', id: 'id:cover', path_lower: '/bloud/sunset drive/cover.jpg',
    path_display: '/bloud/Sunset Drive/cover.jpg', size: 2048, server_modified: '2026-11-10T10:00:00Z',
  });
  entries.push({
    '.tag': 'file', name: '01 - Aria Vale - Neon Tides.lrc', id: 'id:lrc',
    path_lower: '/bloud/sunset drive/01 - aria vale - neon tides.lrc',
    path_display: '/bloud/Sunset Drive/01 - Aria Vale - Neon Tides.lrc', size: 400,
    server_modified: '2026-11-10T10:00:00Z',
  });
  entries.push({
    '.tag': 'file', name: '.bloud_db.json', id: 'id:db',
    path_lower: '/bloud/.bloud_db.json', path_display: '/bloud/.bloud_db.json', size: 300,
    server_modified: '2026-11-10T10:00:00Z',
  });
  [...folders].forEach((f, idx) => {
    if (f === FOLDER) return;
    entries.push({ '.tag': 'folder', name: f.split('/').pop(), id: 'id:dir' + idx, path_lower: f.toLowerCase(), path_display: f });
  });
  return entries.map((e) => normalize(e));
}

const LRC = `[00:06.00]Streetlights bending on the glass
[00:12.50]Counting every mile we pass
[00:19.00]Radio low, the city hums
[00:25.50]Waiting for the night to come
[00:32.00]Hold on, hold on, we're almost there`;

export const mockDb = {
  app: 'bloud', version: 2, updatedAt: '2026-11-10T10:00:00Z',
  liked: {}, disliked: {}, notes: {}, playCounts: {}, playlists: [], recentIds: [], searchHist: [],
};

export function mockText(path) {
  if (path && /\.lrc$/i.test(path)) {
    /* Real-shaped LRC: [ti:]/[ar:]/[al:]/[length:] header plus timed lines.
       Enough lines that the lyric sheet is meaningfully exercised. */
    return '[ti:Aashiyan]\n[ar:gini]\n[al:Aashiyan]\n[length:2:54]\n'
      + '[00:07.45]ये जहान है बे-रहम\n[00:13.58]डोर बिन खो जाएगी ये पतंग\n'
      + '[00:20.70]फिर भी मैं छान दूँ पूरा गगन\n[00:27.81]तेरे लिए यूँ रहूँ बे-सबर\n'
      + '[00:35.87]पलकों पे पंछी जो सो रहे थे\n[00:39.38]वो सब भी उड़ गए\n';
  }
  if (path && /\.ttml$/i.test(path)) {
    return '<?xml version="1.0"?><tt xmlns="http://www.w3.org/ns/ttml"><body><div>'
      + '<p begin="7.450" end="11.553"><span begin="7.450">Line</span> <span begin="8.1">one</span></p>'
      + '<p begin="1:00.895" end="1:04.000"><span begin="1:00.895">Line</span> <span begin="1:01.2">two</span></p>'
      + '</div></body></tt>';
  }
  if (path.endsWith('.lrc')) return LRC;
  if (path.endsWith('.bloud_db.json')) return JSON.stringify(mockDb);
  return null;
}

/** A valid 3-second silent WAV, so <audio> really loads something. */
export function silentWav(seconds = 3, rate = 8000) {
  const samples = seconds * rate;
  const dataLen = samples * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  return buf;
}
