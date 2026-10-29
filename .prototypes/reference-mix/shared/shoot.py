#!/usr/bin/env python3
"""Screenshot one prototype at desktop and mobile, with and without reduced motion, and record console errors.

Usage: python3 shared/shoot.py <a|b|c>
Inside a sandbox that cannot launch Chromium, reuse an outside browser and server:
  SHOOT_CDP=http://127.0.0.1:9222 SHOOT_BASE=http://127.0.0.1:4321 python3 shared/shoot.py <a|b|c>
"""
import functools
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
VIEWPORTS = {"desktop": {"width": 1440, "height": 900}, "mobile": {"width": 390, "height": 844}}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def run(name):
    out = ROOT / name / "shots"
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    base = os.environ.get("SHOOT_BASE")
    httpd = None if base else serve()
    url = f"{base.rstrip('/')}/{name}/index.html" if base else f"http://127.0.0.1:{httpd.server_port}/{name}/index.html"
    report = {"prototype": name, "url": url, "errors": [], "routes": {}, "shots": []}

    def shot(page, label, full=False):
        path = out / f"{label}.png"
        page.screenshot(path=str(path), full_page=full)
        report["shots"].append(path.name)

    with sync_playwright() as p:
        cdp = os.environ.get("SHOOT_CDP")
        browser = p.chromium.connect_over_cdp(cdp) if cdp else p.chromium.launch()
        for vp, size in VIEWPORTS.items():
            for motion in ("no-preference", "reduce"):
                mobile = vp == "mobile"
                ctx = browser.new_context(viewport=size, reduced_motion=motion, is_mobile=mobile, has_touch=mobile)
                page = ctx.new_page()
                tag = f"{vp}-{'reduced' if motion == 'reduce' else 'motion'}"
                page.on("console", lambda m, t=tag: m.type == "error" and report["errors"].append(f"[{t}] console: {m.text}"))
                page.on("pageerror", lambda e, t=tag: report["errors"].append(f"[{t}] pageerror: {e}"))
                page.goto(url, wait_until="load")
                page.wait_for_timeout(300)
                shot(page, f"{tag}-01-cover-0300ms")
                page.wait_for_timeout(2200)
                shot(page, f"{tag}-02-cover-2500ms")
                if motion == "reduce":
                    ctx.close()
                    continue
                page.evaluate("window.scrollTo(0, 700)")
                page.wait_for_timeout(900)
                shot(page, f"{tag}-03-scrolled-700")
                page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight * 0.5)")
                page.wait_for_timeout(700)
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(1800)
                shot(page, f"{tag}-04-back-to-top")
                if not mobile:
                    shot(page, f"{tag}-05-home-full", full=True)
                work = page.evaluate("(window.SITE.work.find(w => w.image) || window.SITE.work[0]).slug")
                post = page.evaluate("window.SITE.posts.find(p => p.bodyHtml).slug")
                bare = page.evaluate("window.SITE.posts.find(p => !p.bodyHtml).slug")
                routes = [("06-work", f"#/work/{work}"), ("07-blog", "#/blog"), ("08-post", f"#/blog/{post}"),
                          ("09-post-no-body", f"#/blog/{bare}"), ("10-not-found", "#/nope")]
                for label, route in routes:
                    page.evaluate(f"location.hash = {json.dumps(route)}")
                    page.wait_for_timeout(1600)
                    report["routes"][f"{tag} {route}"] = page.evaluate("document.body.innerText.trim().length")
                    shot(page, f"{tag}-{label}")
                page.go_back()
                page.wait_for_timeout(1400)
                report["routes"][f"{tag} back"] = page.evaluate("location.hash")
                shot(page, f"{tag}-11-history-back")
                ctx.close()
        if not cdp:
            browser.close()
    if httpd:
        httpd.shutdown()

    (out / "report.json").write_text(json.dumps(report, indent=2))
    thin = {k: v for k, v in report["routes"].items() if isinstance(v, int) and v < 200}
    print(f"{name}: {len(report['shots'])} shots in {out}, {len(report['errors'])} console errors, "
          f"{len(thin)} routes under 200 chars of text")
    for e in report["errors"][:20]:
        print("  ", e)
    for k, v in thin.items():
        print(f"   thin route {k}: {v} chars")
    return 1 if report["errors"] or thin else 0


if __name__ == "__main__":
    if len(sys.argv) != 2 or not (ROOT / sys.argv[1] / "index.html").exists():
        sys.exit("usage: python3 shared/shoot.py <dir with index.html under reference-mix>")
    sys.exit(run(sys.argv[1]))
