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
  const sub = [tr.artist, tr.sizeLabel || (tr.dur ? fmt(tr.dur) : '')].filter(Boolean).join(' • ');
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
        const list = tracksForIds(pl.tracks).slice(0, 4);
        const cover = pl.auto ? `<div class="collage">${[0, 1, 2, 3].map((j) => art(list[j] || list[0])).join('')}</div>` : `<div class="collage">${[0, 1, 2, 3].map((j) => art(list[j] || list[0])).join('')}</div>`;
        return `<div class="lrow" data-pl="${esc(pl.id)}">${cover}
          <div class="meta"><b>${esc(pl.name)}</b><span>${pl.auto ? ck : ''}${pl.auto ? 'Folder' : 'Playlist'} • ${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}</span></div>
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
