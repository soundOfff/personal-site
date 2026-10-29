#!/usr/bin/env python3
"""Verification gate for one showcase prototype.

Usage: python3 src/prototypes/showcase/shoot.py <id> [--quick]
  <id>     a variant id from registry.ts (a, b, c, a1 ... c3)
  --quick  desktop without reduced motion only (for fast iteration; the full run is the gate)

Needs the shared dev server: astro dev --port 4400 (SHOOT_BASE overrides the origin).
Writes src/prototypes/showcase/<id>/shots/*.png and shots/report.json.
Exits non-zero on any console error, page error, horizontal overflow, a demo that never plays,
a demo that keeps playing offscreen, a demo that autoplays under reduced motion, a missing
#work or #workflow section, or no snap targets where snapping should be on.
"""
import json
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
BASE = os.environ.get("SHOOT_BASE", "http://127.0.0.1:4400").rstrip("/")
VIEWPORTS = {"desktop": {"width": 1440, "height": 900}, "mobile": {"width": 390, "height": 844}}
# Known noise from the base page, not from any variant.
IGNORED = ("[vite]", "Download the React DevTools", "[astro]")

SNAP_PROBE = """() => {
  const els = [...document.querySelectorAll('main *')].filter((el) => {
    const s = getComputedStyle(el);
    return s.scrollSnapAlign && s.scrollSnapAlign !== 'none' && s.scrollSnapAlign !== 'none none';
  });
  const html = getComputedStyle(document.documentElement).scrollSnapType;
  const body = getComputedStyle(document.body).scrollSnapType;
  return {
    container: html !== 'none' ? 'html: ' + html : body !== 'none' ? 'body: ' + body : 'none',
    targets: els.map((el) => ({
      tag: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList[0] ? '.' + el.classList[0] : ''),
      top: Math.round(el.getBoundingClientRect().top + scrollY),
      height: Math.round(el.getBoundingClientRect().height),
    })),
  };
}"""

VIDEO_STATE = """() => [...document.querySelectorAll('[data-proto] video')].map((v, i) => {
  const r = v.getBoundingClientRect();
  return {
    i, src: v.currentSrc || v.querySelector('source')?.src || v.src || '',
    paused: v.paused, t: Math.round(v.currentTime * 100) / 100, ready: v.readyState,
    inView: r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0,
    visible: r.width > 0 && r.height > 0 && getComputedStyle(v).visibility !== 'hidden',
  };
})"""


def settle(page, ms=900):
    """Wait until scrollY stops changing (snap animations included)."""
    last, still = None, 0
    deadline = time.time() + 4
    while time.time() < deadline:
        y = page.evaluate("scrollY")
        still = still + 1 if y == last else 0
        if still >= 4:
            break
        last = y
        page.wait_for_timeout(ms / 6)
    return page.evaluate("scrollY")


def run_case(browser, vid, name, viewport, reduced, out, report, quick):
    tag = f"{name}{'-reduced' if reduced else ''}"
    ctx = browser.new_context(
        viewport=viewport,
        device_scale_factor=1 if name == "desktop" else 2,
        reduced_motion="reduce" if reduced else "no-preference",
        has_touch=name == "mobile",
        is_mobile=name == "mobile",
    )
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: m.type == "error" and not any(s in m.text for s in IGNORED) and errors.append(m.text[:300]))
    page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:300]}"))
    case = {"case": tag, "fail": [], "notes": []}

    url = f"{BASE}/prototype/showcase?variant={vid}"
    page.goto(url, wait_until="load")
    page.wait_for_timeout(300)
    page.screenshot(path=str(out / f"{tag}-01-cover-0.3s.png"))
    page.wait_for_timeout(2200)
    page.screenshot(path=str(out / f"{tag}-02-cover-2.5s.png"))

    if not page.query_selector(f'[data-proto="{vid}"]'):
        case["fail"].append(f'no element with data-proto="{vid}"')
    for sid in ("work", "workflow"):
        if not page.query_selector(f"[data-proto] #{sid}"):
            case["fail"].append(f"missing section #{sid} inside the variant root")

    order = page.evaluate("""() => [...document.querySelectorAll('main section')]
      .filter((s) => !s.parentElement.closest('main section'))
      .map((s) => s.id || s.classList[0] || 'section')""")
    case["section_order"] = order

    snap = page.evaluate(SNAP_PROBE)
    case["snap"] = {"container": snap["container"], "targets": snap["targets"][:30]}
    settle = page.evaluate("document.documentElement.dataset.settle || null")
    case["snap"]["settle"] = settle
    snapping_expected = not reduced and viewport["height"] >= 640
    if snapping_expected and settle != "on" and (snap["container"] == "none" or not snap["targets"]):
        case["fail"].append("no scroll-snap container or no snap targets (snapping should be on)")
    if reduced and snap["container"] != "none" and "none" not in snap["container"]:
        case["notes"].append(f"snap still on under reduced motion: {snap['container']}")

    # Wheel through the page like a visitor and record where each gesture settles.
    if not reduced or not quick:
        page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
        settle(page)
        page.mouse.move(viewport["width"] / 2, viewport["height"] / 2)
        cover_h = page.evaluate("document.querySelector('.cover')?.offsetHeight || 0")
        stops, prev = [], -1
        for i in range(60):
            page.mouse.wheel(0, viewport["height"] * 0.45)
            y = settle(page)
            near = min((abs(t["top"] - y) for t in snap["targets"]), default=None)
            stops.append({"y": y, "nearest_snap_dist": near})
            if y == prev:
                break
            prev = y
        case["wheel_stops"] = stops
        in_cover = [s for s in stops if 30 < s["y"] < cover_h - 30]
        if not reduced and cover_h and len(in_cover) < 2:
            case["fail"].append(f"cover scrub skipped: only {len(in_cover)} wheel stops inside the {cover_h}px cover")

        # Keyboard: Page Down from the top.
        page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
        settle(page)
        keys = []
        for _ in range(8):
            page.keyboard.press("PageDown")
            keys.append(settle(page))
        case["pagedown_stops"] = keys
        if len(set(keys)) < 4:
            case["fail"].append(f"Page Down got stuck: {keys}")

    # Slow mouse-wheel notches (100 px, 150 ms apart) must move the page from every section start.
    # Proximity snapping with dense snap points pulls each notch back and traps the visitor.
    if not reduced and name == "desktop":
        traps = []
        for sid in ("work", "workflow"):
            start = page.evaluate(f"(() => {{ const s = document.querySelector('[data-proto] #{sid}'); return s ? Math.round(s.getBoundingClientRect().top + scrollY) : null; }})()")
            if start is None:
                continue
            page.evaluate(f"scrollTo({{top: {start}, behavior: 'instant'}})")
            settle(page, 600)
            y0 = page.evaluate("scrollY")
            for _ in range(10):
                page.mouse.wheel(0, 100)
                page.wait_for_timeout(150)
            y1 = settle(page, 600)
            traps.append({"from": sid, "start": y0, "end": y1})
            if y1 - y0 < 500:
                case["fail"].append(f"slow wheel trapped at #{sid}: 10 notches moved {y1 - y0}px")
        case["slow_wheel"] = traps

    # Sections, one viewport shot each.
    n = page.evaluate("""() => [...document.querySelectorAll('main section')]
      .filter((s) => !s.parentElement.closest('main section')).length""")
    for i in range(n):
        page.evaluate(f"""() => {{
          const s = [...document.querySelectorAll('main section')].filter((s) => !s.parentElement.closest('main section'))[{i}];
          scrollTo({{top: s.getBoundingClientRect().top + scrollY, behavior: 'instant'}});
        }}""")
        settle(page, 600)
        page.wait_for_timeout(900)
        sid = order[i] if i < len(order) else f"s{i}"
        page.screenshot(path=str(out / f"{tag}-10-sec{i:02d}-{sid}.png"))

    wf = page.query_selector("[data-proto] #workflow")
    if wf:
        wf.scroll_into_view_if_needed()
        page.wait_for_timeout(1500)
        try:
            wf.screenshot(path=str(out / f"{tag}-20-workflow.png"))
        except Exception as e:  # very tall sections can exceed the screenshot limit
            case["notes"].append(f"workflow element shot failed: {e}")

    # Demos: each video in view for 2.5 s should play (unless reduced motion), and pause offscreen.
    videos = page.evaluate(VIDEO_STATE)
    played = []
    for v in videos:
        page.evaluate(f"""() => {{
          const v = document.querySelectorAll('[data-proto] video')[{v['i']}];
          const r = v.getBoundingClientRect();
          if (r.width && r.height) scrollTo({{top: r.top + scrollY - (innerHeight - r.height) / 2, behavior: 'instant'}});
        }}""")
        settle(page, 600)
        page.wait_for_timeout(2500)
        states = page.evaluate(VIDEO_STATE)
        if v["i"] >= len(states):
            case["notes"].append(f"video {v['i']} disappeared while scrolling")
            continue
        state = states[v["i"]]
        played.append(state)
        if state["inView"] and state["visible"]:
            page.screenshot(path=str(out / f"{tag}-30-demo{v['i']}.png"))
    case["videos"] = played
    playing = [s for s in played if not s["paused"] and s["t"] > 0.2]
    if not reduced:
        if not videos:
            case["fail"].append("no <video> inside the variant root")
        elif not playing:
            case["fail"].append("no demo video played after 2.5 s in view")
    else:
        if playing:
            case["fail"].append(f"{len(playing)} video(s) autoplayed under reduced motion")

    page.evaluate("scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'})")
    settle(page, 600)
    page.wait_for_timeout(1000)
    offscreen = [s for s in page.evaluate(VIDEO_STATE) if not s["inView"] and not s["paused"]]
    if offscreen:
        case["fail"].append(f"{len(offscreen)} video(s) still playing offscreen")

    # Back to the top: the cover should replay.
    page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
    page.wait_for_timeout(1100)
    page.screenshot(path=str(out / f"{tag}-40-back-to-top.png"))

    overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
    if overflow > 1:
        case["fail"].append(f"horizontal overflow of {overflow}px")

    if name == "desktop" and not reduced:
        page.screenshot(path=str(out / f"{tag}-50-full.png"), full_page=True)

    case["console_errors"] = errors
    if errors:
        case["fail"].append(f"{len(errors)} console/page error(s)")
    report.append(case)
    ctx.close()
    status = "FAIL " + "; ".join(case["fail"]) if case["fail"] else "ok"
    print(f"  {tag}: {status}", flush=True)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    vid = sys.argv[1]
    quick = "--quick" in sys.argv
    out = HERE / vid / "shots"
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    report = []
    print(f"shoot {vid} against {BASE}", flush=True)
    with sync_playwright() as p:
        # Branded Chrome plays H.264; the bundled Chromium only plays WebM.
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        cases = [("desktop", False)] if quick else [("desktop", False), ("desktop", True), ("mobile", False), ("mobile", True)]
        for name, reduced in cases:
            try:
                try:
                    run_case(browser, vid, name, VIEWPORTS[name], reduced, out, report, quick)
                except Exception as e:
                    if "Execution context was destroyed" not in str(e):
                        raise
                    print(f"  {name}{'-reduced' if reduced else ''}: page navigated mid-run, retrying once", flush=True)
                    run_case(browser, vid, name, VIEWPORTS[name], reduced, out, report, quick)
            except Exception as e:
                report.append({"case": f"{name}{'-reduced' if reduced else ''}", "fail": [f"crashed: {e}"]})
                print(f"  {name}{'-reduced' if reduced else ''}: FAIL crashed: {e}", flush=True)
        browser.close()
    (out / "report.json").write_text(json.dumps(report, indent=2))
    failed = [c for c in report if c.get("fail")]
    shots = len(list(out.glob("*.png")))
    print(f"{vid}: {'FAIL' if failed else 'PASS'} ({len(report) - len(failed)}/{len(report)} cases ok, {shots} shots in {out})")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
