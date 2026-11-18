/**
 * Static build — Vercel's Vite preset expects `npm run build` to emit `dist/`.
 * bloud has no bundler: the client is app.js + app.css, already concatenated
 * from app/*.js and app.css sources. This just stages the public files.
 *
 * api/ and lib/ stay at the repository root — Vercel picks them up as
 * serverless functions automatically.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');

const PUBLIC = [
  'index.html',
  'app.js',
  'app.css',
  'manifest.webmanifest',
  'icon.svg',
];

/* Subdirectories copied verbatim (fonts for non-Latin lyric scripts). */
const PUBLIC_DIRS = ['fonts'];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const file of PUBLIC) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) throw new Error(`missing public file: ${file}`);
  fs.copyFileSync(src, path.join(OUT, file));
}

for (const dir of PUBLIC_DIRS) {
  const src = path.join(ROOT, dir);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(OUT, dir), { recursive: true });
}

// guard: app.js is generated from app/*.js — fail the build if it is stale
const sources = fs
  .readdirSync(path.join(ROOT, 'app'))
  .filter((f) => f.endsWith('.js'))
  .sort();
const joined = sources.map((f) => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8')).join('');
const built = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
if (joined.trim() !== built.trim()) {
  console.warn('warning: app.js is out of date with app/*.js — run `cat app/*.js > app.js`');
}

const walkSize = (dir) =>
  fs.readdirSync(dir).reduce((n, f) => {
    const p = path.join(dir, f);
    return n + (fs.statSync(p).isDirectory() ? walkSize(p) : fs.statSync(p).size);
  }, 0);
const size = walkSize(OUT);
console.log(`built dist/ — ${PUBLIC.length} files, ${(size / 1024).toFixed(1)} KB`);
