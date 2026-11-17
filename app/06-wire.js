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
