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
function parseLyrics(raw, duration) {
  if (!raw) return { lines: [], synced: false };
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
