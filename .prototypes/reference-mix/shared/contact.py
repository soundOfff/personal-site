#!/usr/bin/env python3
"""Tile a prototype's shoot.py screenshots into labeled contact sheets.

Usage: python3 shared/contact.py <a|b|c>
Writes <dir>/shots/contact-desktop.png, contact-mobile.png and contact-reduced.png.
"""
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
GROUPS = {
    "desktop": ("desktop-motion-*.png", 4, 1440, 900),
    "mobile": ("mobile-motion-*.png", 5, 390, 844),
    "reduced": ("*-reduced-*.png", 4, 1440, 900),
}


def sheet(page, files, cols, w, h, out):
    cell = 1800 // cols
    tiles = "".join(
        f'<figure><img src="{f.as_uri()}" style="aspect-ratio:{w}/{h}"><figcaption>{f.stem}</figcaption></figure>'
        for f in files
    )
    html = out.with_suffix(".html")
    html.write_text(
        f"""<style>body{{margin:0;background:#222;display:grid;grid-template-columns:repeat({cols},{cell}px);gap:6px;padding:6px}}
        figure{{margin:0}}img{{width:100%;display:block;object-fit:cover;object-position:top;background:#fff}}
        figcaption{{font:12px/1.6 monospace;color:#ddd}}</style>{tiles}"""
    )
    page.goto(html.as_uri(), wait_until="load")
    page.screenshot(path=str(out), full_page=True)
    html.unlink()


def run(name):
    shots = ROOT / name / "shots"
    cdp = os.environ.get("SHOOT_CDP")
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(cdp) if cdp else p.chromium.launch(args=["--allow-file-access-from-files"])
        page = browser.new_context(viewport={"width": 1812, "height": 800}).new_page()
        for group, (pattern, cols, w, h) in GROUPS.items():
            files = sorted(f for f in shots.glob(pattern) if "full" not in f.stem and not f.stem.startswith("contact"))
            if files:
                out = shots / f"contact-{group}.png"
                sheet(page, files, cols, w, h, out)
                print(out)
        page.context.close()
        if not cdp:
            browser.close()


if __name__ == "__main__":
    run(sys.argv[1])
