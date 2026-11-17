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
    <div class="mrow"><span>Liked • playlists<small>${likedTracks().length} liked • ${(DB.playlists || []).length} playlists • saved to Dropbox</small></span>
      <button class="pill-btn" id="setPush">Save now</button></div>
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
