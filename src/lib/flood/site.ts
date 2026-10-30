/** Behavior shared by every page: header, footer art, covers, scrubbing, copy and reading aids. */
import {
  GLYPH,
  PALETTE,
  bfs,
  draw,
  grid,
  hash,
  nearest,
  size,
  type Grid,
  type Rect,
} from './pixels';
import { onScroll, reducedMotion } from './scroll';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const announcer = () => document.querySelector('#announcer');

function initHeader() {
  const header = document.querySelector<HTMLElement>('#header')!;
  const cover = document.querySelector<HTMLElement>('.cover-sticky');
  const blue = [...document.querySelectorAll<HTMLElement>('[data-on-blue]')];
  const sections = ['contact', 'index', 'work']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);
  const sectionLinks = [...header.querySelectorAll<HTMLAnchorElement>('[data-section]')];
  const home = location.pathname === '/';
  let previous = window.scrollY;

  header.addEventListener('focusin', () => header.classList.remove('hidden'));
  onScroll((y) => {
    const delta = y - previous;
    previous = y;
    const inCover = !!cover && y <= cover.clientHeight + 80;
    if (
      reducedMotion.matches ||
      inCover ||
      header.contains(document.activeElement) ||
      delta < -3 ||
      y < 100
    ) {
      header.classList.remove('hidden');
    } else if (delta > 3 && y > 120) header.classList.add('hidden');

    header.classList.toggle(
      'on-blue',
      blue.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < 60 && r.bottom > 60;
      }),
    );

    if (!home) return;
    const current = sections.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top < innerHeight * 0.4 && r.bottom > 100;
    })?.id;
    sectionLinks.forEach((link) =>
      link.classList.toggle('active', link.dataset.section === current),
    );
  });
}

function initReadingProgress() {
  const body = document.querySelector<HTMLElement>('[data-progress]');
  const bar = document.querySelector<HTMLElement>('#reading-progress');
  if (!body || !bar) return;
  onScroll((y) => {
    const top = body.getBoundingClientRect().top + y;
    const progress = clamp((y - top + 100) / Math.max(1, body.offsetHeight - innerHeight + 100));
    // Whole cells only: the bar fills one 15px cell at a time.
    bar.style.width = `${Math.round(progress * Math.floor(innerWidth / 15)) * 15}px`;
  });
}

/** Generated project covers, the detail hero and the 404 cave. */
function initStaticCaves() {
  type Entry = {
    canvas: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
    grid?: Grid;
    width?: number;
    height?: number;
  };
  const entries: Entry[] = [
    ...document.querySelectorAll<HTMLCanvasElement>('canvas[data-cave]'),
  ].map((canvas) => ({
    canvas,
  }));
  if (!entries.length) return;

  function layout(entry: Entry) {
    const rect = entry.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (entry.width === rect.width && entry.height === rect.height) return true;
    entry.width = rect.width;
    entry.height = rect.height;
    entry.ctx = size(entry.canvas, rect.width, rect.height);
    const title = entry.canvas.parentElement
      ?.querySelector('.generated-title')
      ?.getBoundingClientRect();
    const clear: Rect[] = title
      ? [
          {
            left: title.left - rect.left,
            right: title.right - rect.left,
            top: title.top - rect.top,
            bottom: title.bottom - rect.top,
          },
        ]
      : [];
    entry.grid = grid(rect.width, rect.height, hash(entry.canvas.dataset.cave!), 20, clear);
    return true;
  }

  // The detail hero blooms once; every other cave is drawn whole.
  const bloom = entries.find((entry) => entry.canvas.hasAttribute('data-bloom'));
  let blooming = !!bloom && !reducedMotion.matches;

  const observer = new ResizeObserver((records) => {
    for (const record of records) {
      const entry = entries.find((e) => e.canvas === record.target)!;
      if (layout(entry) && !(blooming && entry === bloom)) draw(entry.ctx!, entry.grid!);
    }
  });
  entries.forEach((entry) => observer.observe(entry.canvas));

  if (!blooming) return;
  const start = performance.now();
  function frame(now: number) {
    if (!layout(bloom!)) return;
    const progress = Math.min(1, (now - start) / 650);
    draw(bloom!.ctx!, bloom!.grid!, { progress });
    if (progress < 1) requestAnimationFrame(frame);
    else blooming = false;
  }
  requestAnimationFrame(frame);
}

/** How long the copy button says "Copied ✓", and the ✳ stays lit. */
const COPIED_MS = 2500;
const RING_MS = 900;
const GROW_MS = 320;

/**
 * The footer's ✳ of cells. BFS rings ripple out from the pointer, and it lights up from the
 * centre while the email sits on the clipboard (or the mail app opens), then drains.
 */
function initFooterArt() {
  const footer = document.querySelector<HTMLElement>('#contact');
  const canvas = footer?.querySelector<HTMLCanvasElement>('.footer-art');
  if (!footer || !canvas) return;
  let ctx: CanvasRenderingContext2D | undefined;
  let g: Grid | undefined;
  let w = 0;
  let h = 0;
  let id = 0;
  let visible = false;
  let timer = 0;
  let ring = -1e6;
  let lit = -1e6;

  /** How far from the centre (in cells) the ✳ is lit at `now`: it grows, holds, drains. */
  function radius(now: number) {
    const e = now - lit;
    if (e < 0 || e > COPIED_MS + GROW_MS) return -1;
    if (reducedMotion.matches) return e < COPIED_MS ? 9 : -1;
    if (e < GROW_MS) return (e / GROW_MS) * 5;
    if (e < COPIED_MS) return 5;
    return 5 - ((e - COPIED_MS) / GROW_MS) * 5;
  }

  function paint(now: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const step = Math.max(4, Math.floor(Math.min(w, h) / (g ? 13 : 7)));
    const gap = step >= 16 ? 2 : 1;
    const ox = Math.round((w - step * 7) / 2);
    const oy = Math.round((h - step * 7) / 2);
    const r = radius(now);
    GLYPH.forEach((row, y) =>
      [...row].forEach((bit, x) => {
        if (bit !== '1') return;
        ctx!.fillStyle = Math.abs(x - 3) + Math.abs(y - 3) < r ? PALETTE.light : PALETTE.paper;
        ctx!.fillRect(ox + x * step, oy + y * step, step - gap, step - gap);
      }),
    );
    const t = (now - ring) / RING_MS;
    if (!g || reducedMotion.matches || t < 0 || t >= 1) return;
    ctx.fillStyle = PALETTE.light;
    for (const i of g.order) {
      if (Math.abs(g.dist[i] - t * g.maxDist) < 1.7)
        ctx.fillRect((i % g.cols) * g.cell, Math.floor(i / g.cols) * g.cell, 6, 6);
    }
  }
  const busy = (now: number) => now - ring < RING_MS || now - lit < COPIED_MS + GROW_MS;
  function frame(now: number) {
    id = 0;
    if (!visible || document.hidden) return;
    paint(now);
    if (!reducedMotion.matches && busy(now)) id = requestAnimationFrame(frame);
  }
  function kick() {
    if (reducedMotion.matches) {
      // No motion: show the lit state now and repaint once when it is over.
      paint(performance.now());
      clearTimeout(timer);
      timer = window.setTimeout(() => paint(performance.now()), COPIED_MS + 20);
      return;
    }
    if (!id && visible) id = requestAnimationFrame(frame);
  }
  /** The email went out: light the ✳ and send one ring out from its centre. */
  function answer() {
    lit = performance.now();
    if (g && !reducedMotion.matches) {
      bfs(g, nearest(g, w / 2 / g.cell, h / 2 / g.cell));
      ring = lit;
    }
    kick();
  }
  function ripple(event: PointerEvent) {
    // The small phone ✳ has no room for rings; a tap lights it instead.
    if (!g) {
      if (event.type === 'pointerdown') answer();
      return;
    }
    if (!visible || reducedMotion.matches) return;
    // Throttled so a moving pointer starts a new ring at most every 540ms.
    if (event.type === 'pointermove' && performance.now() - ring < 540) return;
    const r = canvas!.getBoundingClientRect();
    bfs(g, nearest(g, (event.clientX - r.left) / g.cell, (event.clientY - r.top) / g.cell));
    ring = performance.now();
    kick();
  }

  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height || (r.width === w && r.height === h)) return;
    w = r.width;
    h = r.height;
    ctx = size(canvas, w, h);
    g = w >= 160 && h >= 160 ? grid(w, h, 42, 16) : undefined;
    paint(performance.now());
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      paint(performance.now());
      if (busy(performance.now())) kick();
    } else {
      cancelAnimationFrame(id);
      id = 0;
    }
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible && busy(performance.now())) kick();
  });
  canvas.addEventListener('pointermove', ripple);
  canvas.addEventListener('pointerdown', ripple);
  footer.addEventListener('copied', answer);
  footer.querySelector('a[href^="mailto:"]')?.addEventListener('click', answer);
}

/** "It's 14:32 there now." in Rosario, ticking only while the footer is on screen. */
function initFooterClock() {
  const footer = document.querySelector<HTMLElement>('#contact');
  const time = footer?.querySelector<HTMLTimeElement>('[data-clock] time');
  if (!footer || !time) return;
  const format = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Cordoba',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const tick = () => {
    const value = format.format(new Date());
    if (time.textContent === value) return;
    time.textContent = value;
    time.dateTime = value;
  };
  let timer = 0;
  let inView = false;
  const sync = () => {
    const run = inView && !document.hidden;
    if (run && !timer) {
      tick();
      timer = window.setInterval(tick, 10_000);
    } else if (!run && timer) {
      clearInterval(timer);
      timer = 0;
    }
  };
  tick();
  footer.dataset.clockOn = '';
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(footer);
  document.addEventListener('visibilitychange', sync);
}

/** Cursor X scrubs through a project's screenshots; touch swipes through them. */
function initScrubbers() {
  document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
    const sources: string[] = JSON.parse(el.dataset.scrub!);
    const img = el.querySelector<HTMLImageElement>('.project-shot')!;
    const backdrop = el.querySelector<HTMLImageElement>('.media-backdrop');
    const count = el.querySelector<HTMLElement>('.media-count')!;
    const bar = el.querySelector<HTMLElement>('.scrub-bar')!;
    let pos = 0;
    let target = 0;
    let id = 0;
    let visible = false;
    let last = 0;
    let touchStart = 0;
    let dragged = false;

    function apply() {
      const n = Math.min(sources.length - 1, Math.floor(pos * sources.length));
      if (n !== last) {
        img.src = sources[n];
        if (backdrop) backdrop.src = sources[n];
        count.textContent = `${n + 1} / ${sources.length}`;
        last = n;
      }
      bar.style.width = `${100 / sources.length}%`;
      bar.style.left = `${(100 - 100 / sources.length) * pos}%`;
    }
    function frame() {
      id = 0;
      if (document.hidden || !visible) return;
      pos = reducedMotion.matches ? target : pos + (target - pos) * 0.12;
      apply();
      if (Math.abs(pos - target) > 0.002) id = requestAnimationFrame(frame);
    }

    el.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      target = Math.max(0, Math.min(0.999, (event.clientX - r.left) / r.width));
      if (!id) id = requestAnimationFrame(frame);
    });
    el.addEventListener(
      'touchstart',
      (event) => {
        touchStart = event.touches[0].clientX;
        dragged = false;
      },
      { passive: true },
    );
    el.addEventListener(
      'touchmove',
      (event) => {
        const diff = touchStart - event.touches[0].clientX;
        if (Math.abs(diff) <= 18) return;
        dragged = true;
        pos = target = Math.max(
          0,
          Math.min(0.999, (last + (diff > 0 ? 1 : -1) + 0.5) / sources.length),
        );
        touchStart = event.touches[0].clientX;
        apply();
      },
      { passive: true },
    );
    // A swipe is not a tap on the card.
    el.closest('a')?.addEventListener('click', (event) => {
      if (!dragged) return;
      event.preventDefault();
      dragged = false;
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) cancelAnimationFrame(id);
    }).observe(el);
    apply();
  });
}

async function copy(button: HTMLButtonElement) {
  const value = button.dataset.copy!;
  const label = button.dataset.copyLabel!;
  try {
    await navigator.clipboard.writeText(value);
    button.textContent = 'Copied ✓';
    announcer()!.textContent = 'Copied to clipboard';
    button.dispatchEvent(new CustomEvent('copied', { bubbles: true }));
    setTimeout(() => {
      if (button.isConnected) button.textContent = label;
    }, COPIED_MS);
  } catch {
    // No clipboard access: hand over a selected field instead, once per button.
    button.textContent = 'Select to copy';
    const next = button.nextElementSibling;
    let input =
      next instanceof HTMLInputElement && next.classList.contains('copy-fallback') ? next : null;
    if (!input) {
      input = document.createElement('input');
      input.value = value;
      input.readOnly = true;
      input.className = 'copy-fallback';
      input.setAttribute('aria-label', 'Copy this text');
      button.insertAdjacentElement('afterend', input);
    }
    input.focus();
    input.select();
  }
}

function initReading() {
  document.querySelectorAll<HTMLElement>('.reading pre').forEach((pre) => {
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', 'Code example, scroll horizontally');
  });
  document.querySelectorAll('.reading table').forEach((table) => {
    const wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Data table, scroll horizontally');
    table.parentNode!.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

export function initSite() {
  initHeader();
  initReadingProgress();
  initStaticCaves();
  initFooterArt();
  initFooterClock();
  initScrubbers();
  initReading();

  document.addEventListener('click', (event) => {
    const target = (event.target as Element).closest<HTMLElement>('a, button');
    if (!target) return;
    if (target instanceof HTMLButtonElement && target.dataset.copy) void copy(target);
    if (target.hasAttribute('data-top'))
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = document.querySelector<HTMLDetailsElement>('details.toc[open]');
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  });
}
