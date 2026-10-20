// Usage: node shot.mjs <url> <outdir> [--mobile] [--segments=N]
// Launches installed Google Chrome headless (no download), captures viewport, full page,
// N scroll segments, a mobile shot, saves HTML, and writes analysis.json with
// animation / sound / library signals. Safe to run concurrently from several agents.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , url, outdir, ...flags] = process.argv;
if (!url || !outdir) { console.error('usage: node shot.mjs <url> <outdir>'); process.exit(1); }
const segN = Number((flags.find(f => f.startsWith('--segments=')) || '--segments=8').split('=')[1]);
mkdirSync(outdir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const consoleMsgs = [];
page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`.slice(0, 300)));
const requests = new Set();
page.on('request', r => { const u = r.url(); if (/\.(js|mjs|css|mp3|wav|ogg|m4a|woff2?|json)(\?|$)/i.test(u)) requests.add(u); });

try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
catch (e) { console.error('goto:', e.message.slice(0, 120)); }
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outdir}/viewport.png` });

// Scroll through to trigger lazy/scroll-driven stuff, capturing segments
const total = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
const step = 900;
let i = 0;
for (let y = 0; y < total && i < segN; y += step, i++) {
  await page.evaluate(yy => window.scrollTo(0, yy), y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outdir}/seg-${String(i).padStart(2, '0')}.png` });
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
try { await page.screenshot({ path: `${outdir}/full.png`, fullPage: true }); } catch {}

const html = await page.content();
writeFileSync(`${outdir}/page.html`, html);

const analysis = await page.evaluate(() => {
  const out = {};
  const cs = getComputedStyle(document.body);
  out.body = { bg: cs.backgroundColor, color: cs.color, font: cs.fontFamily, cursor: cs.cursor };
  const h1 = document.querySelector('h1'); if (h1) { const s = getComputedStyle(h1); out.h1 = { font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, text: h1.textContent.trim().slice(0, 140) }; }
  out.fonts = [...new Set([...document.querySelectorAll('body *')].slice(0, 2000).map(e => getComputedStyle(e).fontFamily))].slice(0, 12);
  // keyframes / transitions in accessible stylesheets
  let keyframes = [], transitions = 0, hovers = 0, customProps = new Set(), viewTimeline = 0, hasStyles = 0;
  for (const ss of document.styleSheets) {
    try {
      for (const r of ss.cssRules) {
        hasStyles++;
        if (r.type === CSSRule.KEYFRAMES_RULE) keyframes.push(r.name);
        if (r.type === CSSRule.STYLE_RULE) {
          if (r.style.transition || r.style.transitionProperty) transitions++;
          if (r.selectorText && r.selectorText.includes(':hover')) hovers++;
          if (r.cssText.includes('animation-timeline') || r.cssText.includes('view()') || r.cssText.includes('scroll()')) viewTimeline++;
          for (const p of r.style) if (p.startsWith('--')) customProps.add(p);
        }
      }
    } catch {}
  }
  out.css = { rulesRead: hasStyles, keyframes: [...new Set(keyframes)].slice(0, 60), transitionRules: transitions, hoverRules: hovers, scrollDrivenRules: viewTimeline, customPropsSample: [...customProps].slice(0, 60) };
  out.audio = { audioTags: document.querySelectorAll('audio').length, srcs: [...document.querySelectorAll('audio, audio source')].map(a => a.src || a.getAttribute('src')).filter(Boolean).slice(0, 10) };
  const scripts = [...document.scripts];
  const inline = scripts.filter(s => !s.src).map(s => s.textContent).join('\n');
  out.inlineScriptSignals = {
    AudioContext: /AudioContext/.test(inline), HowlerOrTone: /Howl|Tone\./.test(inline), gsap: /gsap/.test(inline), framer: /framer|motion/.test(inline), three: /THREE|three/.test(inline), lenis: /lenis/i.test(inline), viewTransition: /startViewTransition/.test(inline), webgl: /WebGL|webgl/.test(inline), canvas: document.querySelectorAll('canvas').length,
  };
  out.externalScripts = scripts.filter(s => s.src).map(s => s.src).slice(0, 40);
  out.globals = Object.keys(window).filter(k => /^(gsap|THREE|motion|Lenis|Howl|Tone|p5|PIXI|anime|ScrollTrigger|__NEXT_DATA__|__NUXT__|Astro|___gatsby|__SVELTEKIT|__remixContext)$/i.test(k));
  out.metaGenerator = document.querySelector('meta[name=generator]')?.content || null;
  out.counts = { svg: document.querySelectorAll('svg').length, video: document.querySelectorAll('video').length, img: document.querySelectorAll('img').length, buttons: document.querySelectorAll('button').length, links: document.querySelectorAll('a').length, dialogs: document.querySelectorAll('dialog').length, customElements: [...new Set([...document.querySelectorAll('*')].map(e => e.tagName.toLowerCase()).filter(t => t.includes('-')))].slice(0, 30) };
  out.themeToggles = [...document.querySelectorAll('button, [role=switch], input[type=checkbox]')].filter(b => /theme|dark|light|mode|sound|audio|mute/i.test(b.getAttribute('aria-label') + ' ' + b.className + ' ' + b.id + ' ' + b.textContent)).map(b => (b.getAttribute('aria-label') || b.textContent || b.className).trim().slice(0, 60)).slice(0, 10);
  out.title = document.title; out.scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  return out;
});
analysis.requests = [...requests].slice(0, 80);
analysis.console = consoleMsgs.slice(0, 20);
writeFileSync(`${outdir}/analysis.json`, JSON.stringify(analysis, null, 2));

// mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${outdir}/mobile.png` });

await browser.close();
console.log(`ok ${url} -> ${outdir} (segments: ${i}, height: ${total})`);
