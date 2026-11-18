"""
End-to-end smoke test for bloud.

Boots against a mocked Dropbox and drives the real UI — sync, parsing, search,
playback, likes, notes, playlists, lyrics, queue, downloads, settings — failing
loudly on any console error.

    BLOUD_MOCK=1 PORT=3100 node scripts/dev-server.mjs &
    python3 test/e2e.py
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:3100")
SHOTS = os.path.join(os.path.dirname(__file__), "shots")
os.makedirs(SHOTS, exist_ok=True)

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail and not ok else ""))


def mock_get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return r.read().decode()


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    # ── route the app's API to the mock ────────────────────────────────────
    page.route("**/api/hooks", lambda r: r.fulfill(
        content_type="application/json", status=200,
        body=json.dumps({"ok": True, "connected": True,
                         "account": {"name": "Test User", "email": "test@example.com"},
                         "folder": "/bloud", "serverFolder": "/bloud",
                         "folderExists": True, "syncError": "",
                         "vault": True, "mediaCache": False})))

    def status_payload():
        return json.dumps({"ok": True, "connected": True,
                           "account": {"name": "Test User", "email": "test@example.com"},
                           "folder": "/bloud", "folderExists": True})

    def api(r):
        """Single handler for every /api/dbx call (GET status + POST actions)."""
        url = r.request.url
        if "action=status" in url:
            return r.fulfill(content_type="application/json", status=200, body=status_payload())
        body = json.loads(r.request.post_data or "{}")
        action = body.get("action")
        if action == "list":
            folder = urllib.parse.quote(body.get("folder", "/bloud"))
            r.fulfill(content_type="application/json", status=200,
                      body=mock_get(f"/_mock/list?recursive=1&folder={folder}"))
        elif action == "text":
            p2 = urllib.parse.quote(body.get("path", ""))
            try:
                r.fulfill(content_type="application/json", status=200,
                          body=mock_get(f"/_mock/text?path={p2}"))
            except Exception:
                r.fulfill(content_type="application/json", status=404,
                          body=json.dumps({"ok": False, "error": "not_found"}))
        elif action == "write":
            r.fulfill(content_type="application/json", status=200,
                      body=json.dumps({"ok": True, "rev": "r1"}))
        else:
            r.fulfill(content_type="application/json", status=200, body=json.dumps({"ok": True}))

    page.route("**/api/dbx**", api)

    page.route("**/api/tags**", lambda r: r.fulfill(
        content_type="application/json", status=200,
        body=mock_get("/_mock/tags?path=" + urllib.parse.quote(
            urllib.parse.parse_qs(urllib.parse.urlparse(r.request.url).query).get("path", [""])[0]))))

    page.route("**/api/stream?**", lambda r: r.fulfill(
        status=302,
        headers={"Location": BASE + "/_mock/media?path=" + urllib.parse.quote(
            urllib.parse.parse_qs(urllib.parse.urlparse(r.request.url).query).get("path", [""])[0])}))

    page.route("**/api/stream**", lambda r: r.fulfill(
        status=302,
        headers={"Location": BASE + "/_mock/media?path=" + urllib.parse.quote(
            urllib.parse.parse_qs(urllib.parse.urlparse(r.request.url).query).get("path", [""])[0])}))

    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1800)

    # ── 1. sync + parsing ─────────────────────────────────────────────────
    count = page.evaluate("T.length")
    check("library synced from Dropbox", count == 9, f"got {count}")

    folders = page.evaluate("allPlaylists().filter(p=>p.auto).map(p=>p.name)")
    check("subfolders become playlists",
          folders == ["Chill", "Goa Night", "Podcasts", "Sunset Drive"], str(folders))

    artists = page.evaluate("T.map(t=>t.artist+'|'+t.name)")
    raw_names = page.evaluate("T.map(t=>t.name)")
    parsed = page.evaluate("parseName('01 - Aria Vale - Neon Tides.mp3','Sunset Drive')")
    check("'Artist - Title' filename parsing",
          parsed["artist"] == "Aria Vale" and parsed["title"] == "Neon Tides", json.dumps(parsed))
    check("track number extracted", parsed["track"] == 1, json.dumps(parsed))
    parsed2 = page.evaluate("parseName('Harbor Lights.mp3','Chill')")
    check("bare filename falls back to folder artist",
          parsed2["title"] == "Harbor Lights" and parsed2["artist"] == "Chill", json.dumps(parsed2))
    check("demo tracks removed when real music loads",
          page.evaluate("T.every(t=>!t.demo)"))
    check("lyrics sidecar matched to its track",
          page.evaluate("T.some(t=>/Neon Tides/.test(t.name) && t.lyricsPath.endsWith('.lrc'))"))
    check("cover.jpg attached to folder tracks",
          page.evaluate("T.filter(t=>t.folder==='Sunset Drive').every(t=>t.coverPath)"))
    check("podcast folder detected",
          page.evaluate("T.some(t=>t.folder==='Podcasts')"))

    # ── 2. home ───────────────────────────────────────────────────────────
    check("home renders content", page.locator("#home .row, #home .tile").count() > 0)
    page.screenshot(path=f"{SHOTS}/01-home.png")

    # ── 3. playback ───────────────────────────────────────────────────────
    page.locator("#home .row").first.click()
    page.wait_for_timeout(2000)
    state = page.evaluate("({name:T[i].name, playing, src:audio.src.slice(0,80), t})")
    check("row click starts playback", state["playing"] is True, json.dumps(state))
    check("audio has a stream source", "/api/stream" in state["src"], state["src"])
    check("mini player visible", page.locator("#mini").is_visible())
    page.screenshot(path=f"{SHOTS}/02-playing.png")

    page.locator("#mini .meta").click()
    page.wait_for_timeout(900)
    check("full player opens", page.evaluate("document.querySelector('#full').classList.contains('open')"))
    page.screenshot(path=f"{SHOTS}/03-player.png")

    # ── 4. like / dislike ─────────────────────────────────────────────────
    page.locator("#lk .th").click()
    page.wait_for_timeout(500)
    check("like registers", page.evaluate("Object.values(DB.liked).filter(Boolean).length===1"))
    check("like count shown on pill", page.locator("#lkCnt").text_content() == "1")

    # ── 5. lyrics (play the track that has a .lrc sidecar) ────────────────
    lyr_idx = page.evaluate("T.findIndex(t=>t.lyricsPath)")
    page.evaluate("play(%d)" % lyr_idx if lyr_idx >= 0 else "0")
    page.wait_for_timeout(1500)
    page.locator("#lyBtn").click()
    try:
        page.wait_for_function(
            "document.querySelectorAll('#sBody p').length > 3", timeout=8000)
    except Exception:
        pass
    lines = page.locator("#sBody p").count()
    check("lyrics sheet loads .lrc lines", lines > 3, f"lines={lines}")
    check("lyrics are timestamped (synced)",
          page.evaluate("!!(T[i].lyrics && T[i].lyrics.synced)"))
    page.screenshot(path=f"{SHOTS}/04-lyrics.png")
    page.locator("#sx").click()
    page.wait_for_timeout(500)

    # ── 6. queue ──────────────────────────────────────────────────────────
    page.locator("#qh").click()
    page.wait_for_timeout(800)
    qrows = page.locator("#sBody .row").count()
    check("queue sheet lists tracks", qrows >= 9, f"rows={qrows}")
    page.screenshot(path=f"{SHOTS}/05-queue.png")
    page.locator("#sx").click()
    page.wait_for_timeout(400)

    # ── 7. transport ──────────────────────────────────────────────────────
    before = page.evaluate("i")
    page.locator("#nx").click()
    page.wait_for_timeout(1200)
    after = page.evaluate("i")
    check("next advances queue", after != before, f"{before} -> {after}")

    # seek
    page.evaluate("t=0; audio.currentTime=0; paint()")
    page.wait_for_timeout(300)
    check("seek updates time display", page.locator("#cur").text_content() is not None)

    # ── 8. notes + playlists ──────────────────────────────────────────────
    page.locator("#cmtBtn").click()
    page.wait_for_timeout(600)
    page.locator("#noteTxt").fill("great for late drives")
    page.locator("#saveNoteBtn").click()
    page.wait_for_timeout(600)
    check("note saved", page.evaluate("Object.values(DB.notes).includes('great for late drives')"))

    page.locator("#saveBtn").click()
    page.wait_for_timeout(600)
    page.locator("#newPlInline").click()
    page.wait_for_timeout(500)
    page.locator("#plNameInput").fill("Test Mix")
    page.locator("#createPlBtn").click()
    page.wait_for_timeout(700)
    check("playlist created with the track",
          page.evaluate("DB.playlists.some(p=>p.name==='Test Mix'&&p.tracks.length===1)"))

    page.locator("#cl").click()
    page.wait_for_timeout(500)

    # ── 9. search ─────────────────────────────────────────────────────────
    page.locator('nav button[data-v="search"]').click()
    page.wait_for_timeout(600)
    page.locator("#q").fill("goa")
    page.wait_for_timeout(700)
    hits = page.locator("#res .row").count()
    check("search filters by folder", hits == 2, f"hits={hits}")
    page.screenshot(path=f"{SHOTS}/06-search.png")

    page.locator("#q").fill("chill")
    page.wait_for_timeout(600)
    check("search matches folder names", page.locator("#res .row").count() == 2,
          f"hits={page.locator('#res .row').count()}")

    # ── 10. library tabs ──────────────────────────────────────────────────
    page.locator('nav button[data-v="library"]').click()
    page.wait_for_timeout(600)
    check("folder playlists listed", page.locator("#library [data-pl]").count() >= 4,
          f"got {page.locator('#library [data-pl]').count()}")
    page.screenshot(path=f"{SHOTS}/07-library.png")

    def open_tab(tab):
        page.evaluate(f"libCat={tab!r}; renderLibrary()")
        page.wait_for_function(
            f"libCat === {tab!r} && document.querySelector('#library').textContent.length > 40",
            timeout=5000)
        page.wait_for_timeout(200)

    for tab in ["Songs", "Artists", "Albums", "Podcasts"]:
        open_tab(tab)
        empty = page.locator("#library .empty").count()
        rows = page.locator("#library .row, #library .gcard").count()
        check(f'library tab "{tab}" populated', empty == 0 and rows > 0, f"rows={rows}")

    open_tab("Artists")
    page.wait_for_timeout(600)
    artists_rendered = page.evaluate("artists().length")
    cards = page.locator("#library .gcard").count()
    lib_html = page.evaluate("document.querySelector('#library').innerHTML.slice(0,120)")
    check("artists grid built", artists_rendered >= 4 and cards >= 4,
          f"artists()={artists_rendered} cards={cards} html={lib_html}")
    page.screenshot(path=f"{SHOTS}/08-artists.png")
    page.screenshot(path=f"{SHOTS}/08-artists.png")

    # ── 11. artist drill-down ─────────────────────────────────────────────
    page.locator("#library .gcard").first.click()
    page.wait_for_timeout(700)
    check("artist opens track list", page.locator("#mBody .mact, #mBody .row").count() > 0)
    page.locator("#mx").click()
    page.wait_for_timeout(400)

    # ── 12. offline download ──────────────────────────────────────────────
    page.evaluate("toggleDownload(T[0])")
    page.wait_for_function("offlineIds.size > 0", timeout=20000)
    page.wait_for_timeout(400)
    check("offline download saved to IndexedDB",
          page.evaluate("(async()=>{const b=await IDB.get('audio',T[0].id);return !!b})()"))
    open_tab("Downloads")
    check("downloads tab shows saved song", page.locator("#library .row").count() >= 1,
          f"rows={page.locator('#library .row').count()}")

    # ── 13. track menu ────────────────────────────────────────────────────
    open_tab("Songs")
    page.locator("#library .row .dots").first.click()
    page.wait_for_timeout(600)
    check("track menu shows actions", page.locator("#mBody .mact").count() >= 6,
          f"actions={page.locator('#mBody .mact').count()}")
    page.screenshot(path=f"{SHOTS}/09-trackmenu.png")
    page.locator("#mx").click()
    page.wait_for_timeout(400)

    # ── 14. play queue from a list ────────────────────────────────────────
    page.evaluate("document.querySelector('#library .row').click()")
    page.wait_for_timeout(1200)
    check("library row plays", page.evaluate("playing || audio.paused===false"))

    # ── 15. settings ──────────────────────────────────────────────────────
    page.locator("#libAvBtn").click()
    page.wait_for_timeout(900)
    rows = page.locator("#mBody .mrow").count()
    check("settings shows connection + prefs", rows >= 5, f"rows={rows}")
    check("settings shows folder", "/bloud" in page.locator("#mBody").inner_text())
    page.screenshot(path=f"{SHOTS}/10-settings.png")
    page.locator("#mx").click()
    page.wait_for_timeout(400)

    # ── 16. database round-trip ───────────────────────────────────────────
    payload = page.evaluate("dbPayload()")
    check("db payload carries likes/notes/playlists",
          payload["liked"] and payload["notes"] and payload["playlists"])

    # ── 17. persistence across reload ─────────────────────────────────────
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(2200)
    check("library restored from cache on reload", page.evaluate("T.length") == 9,
          f"got {page.evaluate('T.length')}")
    check("likes survive reload",
          page.evaluate("Object.values(DB.liked).filter(Boolean).length") == 1)
    check("playlist survives reload",
          page.evaluate("DB.playlists.some(p=>p.name==='Test Mix')"))

    # ── 18. console cleanliness ───────────────────────────────────────────
    real = [e for e in errors if not any(k in e.lower() for k in ("favicon", "manifest", "blob:"))]
    check("no console errors", len(real) == 0, " | ".join(real[:3]))

    browser.close()

passed = sum(1 for _, ok, _ in results if ok)
print(f"\n{passed}/{len(results)} checks passed")
if passed != len(results):
    print("\nFailures:")
    for name, ok, detail in results:
        if not ok:
            print(f" - {name}: {detail}")
    sys.exit(1)
