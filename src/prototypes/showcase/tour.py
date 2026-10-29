#!/usr/bin/env python3
"""Record a short scroll-through of one showcase prototype as an mp4.

Usage: python3 src/prototypes/showcase/tour.py <id> [<id> ...]
Writes src/prototypes/showcase/<id>/review/tour.mp4 (1440x900, about 30 s).
Needs the shared dev server on :4400 (SHOOT_BASE overrides it) and ffmpeg.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
BASE = os.environ.get("SHOOT_BASE", "http://127.0.0.1:4400").rstrip("/")
SIZE = {"width": 1440, "height": 900}


def glide(page, dy, steps=14, pause=0.0):
    """A visitor's wheel gesture: a burst of small deltas, then a settle."""
    for _ in range(steps):
        page.mouse.wheel(0, dy / steps)
        page.wait_for_timeout(16)
    page.wait_for_timeout(int(pause * 1000))


def tour(browser, vid):
    out = HERE / vid / "review"
    out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    ctx = browser.new_context(viewport=SIZE, record_video_dir=str(tmp), record_video_size=SIZE)
    page = ctx.new_page()
    page.goto(f"{BASE}/prototype/showcase?variant={vid}", wait_until="load")
    page.mouse.move(900, 420)
    page.wait_for_timeout(2600)
    # Scrub the cover, then walk the next sections, pausing where a visitor would read.
    for _ in range(4):
        glide(page, 450, pause=0.5)
    order = page.evaluate("""() => [...document.querySelectorAll('main section')]
      .filter((s) => !s.parentElement.closest('main section')).map((s) => s.id || s.className.split(' ')[0])""")
    stop_at = order.index("experience") if "experience" in order else len(order)
    while True:
        y = page.evaluate("scrollY")
        top_of_stop = page.evaluate(f"""() => {{
          const s = [...document.querySelectorAll('main section')].filter((s) => !s.parentElement.closest('main section'))[{stop_at}];
          return s ? s.getBoundingClientRect().top + scrollY : document.documentElement.scrollHeight;
        }}""")
        if y + 200 >= top_of_stop:
            break
        glide(page, 520, pause=2.6)
        if page.evaluate("scrollY") == y:
            break
    page.wait_for_timeout(1200)
    video = page.video.path()
    ctx.close()
    target = out / "tour.mp4"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=30,format=yuv420p", "-an",
         "-c:v", "libx264", "-crf", "24", "-preset", "medium", "-movflags", "+faststart", str(target)],
        check=True,
    )
    shutil.rmtree(tmp, ignore_errors=True)
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(target)],
                         capture_output=True, text=True).stdout.strip()
    print(f"{vid}: {target} ({float(dur):.1f} s, {target.stat().st_size // 1024} KB)", flush=True)


def main():
    ids = sys.argv[1:]
    if not ids:
        print(__doc__)
        sys.exit(2)
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        for vid in ids:
            tour(browser, vid)
        browser.close()


if __name__ == "__main__":
    main()
