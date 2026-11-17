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

/** Normalised to the same shape /api/dbx returns to the browser. */
function normalize(e, base = FOLDER) {
  if (e['.tag'] === 'folder') return { tag: 'folder', name: e.name, path: e.path_display, id: e.id, size: 0, modified: '', rev: '' };
  return {
    tag: e['.tag'], name: e.name, path: e.path_display, id: e.id,
    size: e.size || 0, modified: e.server_modified || '', rev: e.rev || '',
    rel: e.path_display.startsWith(base) ? e.path_display.slice(base.length).replace(/^\//, '') : e.path_display,
  };
}

export function mockEntries() {
  const entries = [];
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
