/**
 * Local dev server — emulates Vercel's static hosting + /api functions.
 *   node scripts/dev-server.mjs      (http://localhost:3000)
 * Env vars are read from .env.local / .env if present.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 3000);

/* minimal .env loader */
for (const file of ['.env.local', '.env']) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const MOCK = process.env.BLOUD_MOCK === '1';
const mock = MOCK ? await import(pathToFileURL(path.join(ROOT, 'scripts/mock-dropbox.mjs')).href) : null;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const shim = (res) => {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  res.send = (data) => { res.end(typeof data === 'string' ? data : JSON.stringify(data)); return res; };
  res.redirect = (code, url) => { res.statusCode = code; res.setHeader('Location', url); res.end(); return res; };
  return res;
};

function readBody(req, limit = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function routeApi(req, res, pathname, query) {
  const rel = pathname.replace(/^\/api\/?/, '');
  const candidates = [
    path.join(ROOT, 'api', rel + '.js'),
    path.join(ROOT, 'api', rel, 'index.js'),
  ];
  const file = candidates.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  if (!file) { res.status(404).json({ ok: false, error: 'api route not found' }); return; }

  const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  const handler = mod.default;
  if (typeof handler !== 'function') { res.status(500).json({ ok: false, error: 'no default export' }); return; }

  const bodyParserOff = mod.config?.api?.bodyParser === false;
  const raw = await readBody(req).catch(() => Buffer.alloc(0));

  req.query = query;
  if (bodyParserOff) {
    // expose the raw stream again as an async iterable of the buffered bytes
    req[Symbol.asyncIterator] = async function* () { if (raw.length) yield raw; };
  } else {
    const ct = String(req.headers['content-type'] || '');
    if (raw.length && ct.includes('application/json')) {
      try { req.body = JSON.parse(raw.toString('utf8')); } catch { req.body = {}; }
    } else if (raw.length && ct.includes('application/x-www-form-urlencoded')) {
      req.body = Object.fromEntries(new URLSearchParams(raw.toString('utf8')));
    } else {
      req.body = {};
    }
  }
  if (!res.status) shim(res);
  await handler(req, res);
}

/* ── mock Dropbox endpoints used when BLOUD_MOCK=1 ──────────────────────── */
function handleMock(url, req, res) {
  const q = Object.fromEntries(url.searchParams);
  if (url.pathname === '/_mock/list') {
    const entries = mock.mockEntries();
    const roots = q.recursive === '0' ? entries.filter((e) => e.path_display.split('/').length <= 3) : entries;
    return res.json({ ok: true, folder: q.folder || '/bloud', entries: roots, syncedAt: new Date().toISOString() });
  }
  if (url.pathname === '/_mock/text') {
    const txt = mock.mockText(q.path || '');
    if (txt === null) return res.status(404).json({ ok: false, error: 'not_found' });
    return res.json({ ok: true, text: txt });
  }
  if (url.pathname === '/_mock/media') {
    const wav = mock.silentWav(120);
    res.setHeader('Content-Type', q.path && q.path.endsWith('.jpg') ? 'image/jpeg' : 'audio/wav');
    res.setHeader('Content-Length', wav.length);
    res.setHeader('Accept-Ranges', 'bytes');
    return res.end(wav);
  }
  if (url.pathname === '/_mock/tags') {
    const file = (q.path || '').split('/').pop() || '';
    if (!file.endsWith('.mp3')) return res.json({ ok: true, tags: {} });
    // realistic per-file tags: "01 - Artist - Title.mp3"
    const parts = file.replace(/\.mp3$/i, '').split(/\s+-\s+/);
    const track = (parts[0].match(/^\d+/) || [''])[0];
    const artist = parts.length >= 3 ? parts[1] : (parts.length === 2 ? parts[0] : '');
    const title = parts.length >= 3 ? parts.slice(2).join(' - ') : parts[parts.length - 1];
    const folder = (q.path || '').split('/').slice(-2)[0] || '';
    return res.json({
      ok: true,
      tags: { title, artist: artist || folder, album: folder, track: track || '', year: '2026' },
    });
  }
  return res.status(404).json({ ok: false, error: 'mock route' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const query = Object.fromEntries(url.searchParams);

  if (url.pathname.startsWith('/api/')) {
    try {
      await routeApi(req, res, url.pathname, query);
    } catch (e) {
      console.error('api error', url.pathname, e);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: e.message, stack: e.stack?.split('\n').slice(0, 4) }));
      } else res.end();
    }
    return;
  }

  if (url.pathname.startsWith('/_mock/')) {
    shim(res);
    handleMock(url, req, res);
    return;
  }

  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (url.pathname === '/' || url.pathname === '') file = path.join(ROOT, 'index.html');
  if (!file.startsWith(ROOT)) { res.statusCode = 403; res.end('forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  if (!fs.existsSync(file)) {
    // SPA-ish fallback for the known pages
    if (/^\/(settings|library|search)?$/.test(url.pathname)) file = path.join(ROOT, 'index.html');
    else { res.statusCode = 404; res.end('not found'); return; }
  }
  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`bloud dev server → http://localhost:${PORT}`);
  console.log(`  DROPBOX_APP_KEY set: ${process.env.DROPBOX_APP_KEY ? 'yes' : 'no'}`);
  console.log(`  SUPABASE_URL set:    ${process.env.SUPABASE_URL ? 'yes' : 'no'}`);
});
