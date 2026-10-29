import { PALETTE, grid, hash, patterns, size } from '../../../lib/flood/pixels';
import { onScroll, reducedMotion } from '../../../lib/flood/scroll';

type Chapter = { t: number; label: string };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Arrival time of the flood at each 20px cell: shortest path from the seed through a seeded
 * cave, where walls cost three steps. The wave follows corridors, then fills the rock.
 */
function flood(w: number, h: number, cols: number, rows: number, seed: { x: number; y: number }, caveSeed: number) {
  const cave = grid(w, h, caveSeed, 20);
  const n = cols * rows;
  const dist = new Float32Array(n).fill(Infinity);
  const start = clamp(Math.floor(seed.y / 20), 0, rows - 1) * cols + clamp(Math.floor(seed.x / 20), 0, cols - 1);
  dist[start] = 0;
  const buckets: number[][] = [[start]];
  for (let d = 0; d < buckets.length; d++) {
    for (const i of buckets[d] ?? []) {
      if (dist[i] < d) continue;
      const x = i % cols;
      const y = Math.floor(i / cols);
      for (const j of [x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1, y > 0 ? i - cols : -1, y < rows - 1 ? i + cols : -1]) {
        if (j < 0) continue;
        const next = d + (cave.open[j] ? 1 : 3);
        if (next < dist[j]) {
          dist[j] = next;
          (buckets[next] ??= []).push(j);
        }
      }
    }
  }
  return dist;
}

/** The pinned demo stage: one snap step per product, a flood-fill wipe between them. */
export function initStage(root: HTMLElement) {
  const work = root.querySelector<HTMLElement>('#work');
  if (!work) return;
  const screen = work.querySelector<HTMLElement>('.b2-screen')!;
  const canvas = work.querySelector<HTMLCanvasElement>('.b2-wipe')!;
  const panel = work.querySelector<HTMLElement>('[role="tabpanel"]')!;
  const videos = [...work.querySelectorAll<HTMLVideoElement>('video[data-video]')];
  const tabs = [...work.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const copies = [...work.querySelectorAll<HTMLElement>('[data-copy]')];
  const rails = [...work.querySelectorAll<HTMLElement>('[data-rail]')];
  const markers = [...work.querySelectorAll<HTMLElement>('.b2-step')];
  const count = work.querySelector<HTMLElement>('[data-count]')!;
  const now = work.querySelector<HTMLElement>('[data-now]')!;
  const toggle = work.querySelector<HTMLButtonElement>('.b2-toggle')!;
  const bigPlay = work.querySelector<HTMLButtonElement>('.b2-play')!;
  const chapters: Chapter[][] = JSON.parse(work.dataset.chapters!);
  const names = tabs.map((t) => t.dataset.name!);
  const n = videos.length;

  let active = 0;
  let target = 0;
  let pending: number | null = null;
  let pendingTimer = 0;
  let inView = false;
  let intersecting = false;
  let hover = false;
  let focus = false;
  let manual: 'play' | 'pause' | null = null;
  let raf = 0;
  let wipeRaf = 0;

  const reduced = () => reducedMotion.matches;

  function paintRail() {
    const v = videos[active];
    const ch = chapters[active];
    const t = v.currentTime;
    const d = v.duration || ch[ch.length - 1].t + 4;
    let k = 0;
    ch.forEach((c, j) => t >= c.t && (k = j));
    const items = rails[active].querySelectorAll<HTMLElement>('li');
    items.forEach((li, j) => {
      const end = ch[j + 1]?.t ?? d;
      const p = j < k ? 1 : j > k ? 0 : clamp((t - ch[j].t) / (end - ch[j].t), 0, 1);
      li.style.setProperty('--p', p.toFixed(3));
      li.classList.toggle('is-now', j === k);
    });
    const label = `${String(k + 1).padStart(2, '0')} / ${String(ch.length).padStart(2, '0')}  ${ch[k].label}`;
    if (now.textContent !== label) now.textContent = label;
  }

  function loop() {
    paintRail();
    raf = requestAnimationFrame(loop);
  }

  function controls() {
    const v = videos[active];
    const paused = v.paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} the ${names[active]} demo`);
    toggle.dataset.state = paused ? 'paused' : 'playing';
    bigPlay.hidden = !(paused && (reduced() || manual === 'pause'));
    bigPlay.setAttribute('aria-label', `Play the ${names[active]} demo`);
  }

  function sync() {
    const v = videos[active];
    let want =
      manual === 'play'
        ? intersecting
        : manual === 'pause'
          ? false
          : !reduced() && (inView || ((hover || focus) && intersecting));
    if (document.hidden) want = false;
    if (want && v.paused) v.play().catch(() => {});
    if (!want && !v.paused) v.pause();
    videos.forEach((o, j) => j !== active && !o.paused && o.pause());
    controls();
  }

  function setActive(i: number) {
    videos[active].pause();
    active = i;
    videos.forEach((v, j) => v.classList.toggle('is-active', j === i));
    copies.forEach((c, j) => (c.hidden = j !== i));
    rails.forEach((r, j) => (r.hidden = j !== i));
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tabs[i].id);
    count.textContent = String(i + 1).padStart(2, '0');
    manual = null;
    const v = videos[i];
    if (v.readyState >= 1) v.currentTime = 0;
    paintRail();
    sync();
  }

  /** Cobalt floods the screen cell by cell from `seed`, the demo swaps under full cover, then it drains. */
  function wipe(seed: { x: number; y: number }, mid: () => void) {
    cancelAnimationFrame(wipeRaf);
    const w = screen.clientWidth;
    const h = screen.clientHeight;
    const ctx = size(canvas, w, h);
    const [blueLight, lightPaper] = patterns(ctx);
    const C = 20;
    const cols = Math.ceil(w / C);
    const rows = Math.ceil(h / C);
    const arrive = flood(w, h, cols, rows, seed, hash(names[target]));
    let max = 0;
    for (const d of arrive) max = Math.max(max, d);
    const band = 3;
    const T1 = 520;
    const T2 = 640;
    const start = performance.now();
    let swapped = false;
    canvas.hidden = false;
    const frame = (time: number) => {
      const t = time - start;
      ctx.clearRect(0, 0, w, h);
      const cover = t < T1;
      if (!cover && !swapped) {
        swapped = true;
        mid();
      }
      const front = cover
        ? (0.25 * easeOut(t / T1) + 0.75 * (t / T1)) * (max + band)
        : easeInOut(Math.min(1, (t - T1) / T2)) * (max + band);
      for (let i = 0; i < arrive.length; i++) {
        const age = front - arrive[i];
        let fill: string | CanvasPattern | null;
        if (cover) fill = age < 0 ? null : age < 1 ? lightPaper : age < 2 ? PALETTE.light : age < 3 ? blueLight : PALETTE.blue;
        else fill = age < 0 ? PALETTE.blue : age < 1 ? blueLight : age < 2 ? PALETTE.light : age < 3 ? lightPaper : null;
        if (!fill) continue;
        ctx.fillStyle = fill;
        ctx.fillRect((i % cols) * C, Math.floor(i / cols) * C, C, C);
      }
      if (t < T1 + T2) wipeRaf = requestAnimationFrame(frame);
      else {
        ctx.clearRect(0, 0, w, h);
        canvas.hidden = true;
      }
    };
    wipeRaf = requestAnimationFrame(frame);
  }

  /** The flood starts at the edge of the screen nearest the product's tab. */
  function seedFor(i: number) {
    const s = screen.getBoundingClientRect();
    const t = tabs[i].getBoundingClientRect();
    return {
      x: clamp(t.left + t.width / 2 - s.left, 0, s.width - 1),
      y: clamp(t.top + t.height / 2 - s.top, 0, s.height - 1),
    };
  }

  function go(i: number) {
    if (i === target) return;
    target = i;
    if (reduced()) setActive(i);
    else wipe(seedFor(i), () => setActive(i));
  }

  const stepTop = (i: number) => work.getBoundingClientRect().top + scrollY + markers[i].offsetTop;

  function jump(i: number) {
    pending = i;
    clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(() => (pending = null), 1400);
    scrollTo({ top: stepTop(i), behavior: reduced() ? 'instant' : 'smooth' });
    go(i);
  }

  onScroll(() => {
    const step = markers[1]?.offsetTop || innerHeight;
    const idx = clamp(Math.round(-work.getBoundingClientRect().top / step), 0, n - 1);
    if (pending !== null) {
      if (idx === pending) pending = null;
      return;
    }
    go(idx);
  });

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => jump(i));
    tab.addEventListener('keydown', (event) => {
      const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      const next = (i + delta + n) % n;
      tabs[next].focus();
      jump(next);
    });
  });

  rails.forEach((rail) =>
    rail.querySelectorAll<HTMLButtonElement>('[data-seek]').forEach((button) =>
      button.addEventListener('click', () => {
        const v = videos[active];
        v.currentTime = Number(button.dataset.seek) + 0.05;
        if (!reduced()) manual = null;
        paintRail();
        sync();
      }),
    ),
  );

  toggle.addEventListener('click', () => {
    manual = videos[active].paused ? 'play' : 'pause';
    sync();
  });
  bigPlay.addEventListener('click', () => {
    manual = 'play';
    sync();
  });

  videos.forEach((v, j) => {
    v.addEventListener('play', () => {
      if (j !== active) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
      controls();
    });
    v.addEventListener('pause', () => {
      if (j !== active) return;
      cancelAnimationFrame(raf);
      paintRail();
      controls();
    });
    v.addEventListener('seeked', () => j === active && paintRail());
  });

  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  screen.addEventListener('pointerenter', () => {
    if (!finePointer.matches) return;
    hover = true;
    sync();
  });
  screen.addEventListener('pointerleave', () => {
    hover = false;
    sync();
  });
  const pin = work.querySelector<HTMLElement>('.b2-pin')!;
  pin.addEventListener('focusin', () => {
    focus = true;
    sync();
  });
  pin.addEventListener('focusout', (event) => {
    if (pin.contains(event.relatedTarget as Node)) return;
    focus = false;
    sync();
  });

  new IntersectionObserver(
    ([entry]) => {
      intersecting = entry.isIntersecting;
      inView = entry.intersectionRatio >= 0.49;
      sync();
    },
    { threshold: [0, 0.5] },
  ).observe(screen);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);

  setActive(0);
}
