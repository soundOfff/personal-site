/**
 * Each product is a room in the same rock as the workflow map. The demo is the lit window:
 * a cobalt veil drains off it in BFS order the first time it comes into view, and the
 * chapter beats fill a track one cell at a time.
 */
import { PALETTE, hash, patterns, size } from '../../../lib/flood/pixels';
import { reducedMotion } from '../../../lib/flood/scroll';

const CELL = 20;
const TRACK_CELL = 10;
const DRAIN_MS = 800;
const hoverable = matchMedia('(hover: hover) and (pointer: fine)');

interface Chapter {
  t: number;
  label: string;
}

export function initRooms(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-demo-room]').forEach((room) => initRoom(room));
}

function initRoom(room: HTMLElement) {
  const stage = room.querySelector<HTMLElement>('[data-stage]')!;
  const win = room.querySelector<HTMLElement>('[data-window]')!;
  const screen = room.querySelector<HTMLElement>('[data-screen]')!;
  const video = screen.querySelector('video')!;
  const veil = screen.querySelector<HTMLCanvasElement>('[data-veil]')!;
  const rock = stage.querySelector<HTMLCanvasElement>('[data-rock]')!;
  const toggle = room.querySelector<HTMLButtonElement>('[data-play]')!;
  const big = room.querySelector<HTMLButtonElement>('[data-big-play]')!;
  const expand = room.querySelector<HTMLButtonElement>('[data-expand]')!;
  const track = room.querySelector<HTMLElement>('[data-track]')!;
  const fill = room.querySelector<HTMLElement>('[data-fill]')!;
  const ticks = [...room.querySelectorAll<HTMLElement>('[data-tick]')];
  const caption = room.querySelector<HTMLElement>('[data-caption]')!;
  const beats = [...room.querySelectorAll<HTMLButtonElement>('[data-beat]')];
  const chapters: Chapter[] = JSON.parse(room.dataset.chapters!);
  const name = room.dataset.name!;
  let duration = Number(room.dataset.duration);

  let ratio = 0;
  let hover = false;
  let focus = false;
  let userPaused = false;
  let userPlay = false;
  let current = -1;
  let revealed = false;

  const want = () => {
    if (ratio <= 0 || userPaused) return false;
    if (reducedMotion.matches) return userPlay;
    return ratio >= 0.5 || hover || focus || userPlay;
  };
  function sync() {
    if (want()) {
      if (video.paused) video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  }

  function setLabel() {
    const paused = video.paused;
    room.classList.toggle('is-playing', !paused);
    toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} the ${name} demo`);
    toggle.dataset.state = paused ? 'paused' : 'playing';
    big.hidden = !(paused && reducedMotion.matches && !userPlay);
  }

  function progress() {
    const t = video.currentTime;
    const cells = Math.max(1, Math.floor(track.clientWidth / TRACK_CELL));
    fill.style.width = `${Math.round((t / duration) * cells) * TRACK_CELL}px`;
    let k = 0;
    chapters.forEach((c, i) => t + 0.05 >= c.t && (k = i));
    if (k === current) return;
    current = k;
    caption.innerHTML = `<b>${String(k + 1).padStart(2, '0')}</b> ${chapters[k].label}`;
    beats.forEach((b, i) => b.toggleAttribute('data-current', i === k));
    ticks.forEach((b, i) => b.toggleAttribute('data-done', i <= k));
  }

  function placeTicks() {
    const cells = Math.max(1, Math.floor(track.clientWidth / TRACK_CELL));
    ticks.forEach((tick, i) => {
      tick.style.left = `${Math.round((chapters[i].t / duration) * cells) * TRACK_CELL}px`;
    });
  }

  // Rock frame: tones by Chebyshev distance from the screen, roughened like the map.
  /** Whole cells only, so the rock hugs every edge of the window evenly. */
  function fit() {
    const w = Math.floor(stage.clientWidth / CELL) * CELL;
    win.style.width = `${w}px`;
    screen.style.aspectRatio = 'auto';
    screen.style.height = `${Math.round((w * 10) / 16 / CELL) * CELL}px`;
  }

  function paintRock() {
    const s = win.getBoundingClientRect();
    const r = rock.getBoundingClientRect();
    if (!s.width || !r.width) return;
    const ctx = size(rock, r.width, r.height);
    const [p0, p1] = patterns(ctx);
    const tones = [PALETTE.blue, p0, PALETTE.light, p1];
    const left = s.left - r.left;
    const top = s.top - r.top;
    const cols = Math.ceil(r.width / CELL) + 1;
    const rows = Math.ceil(r.height / CELL) + 1;
    const ox = left - Math.ceil(left / CELL) * CELL;
    const oy = top - Math.ceil(top / CELL) * CELL;
    const seed = hash(name);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const cx = ox + x * CELL;
        const cy = oy + y * CELL;
        const dx = Math.max(left - (cx + CELL), cx - (left + s.width), -1);
        const dy = Math.max(top - (cy + CELL), cy - (top + s.height), -1);
        const d = Math.max(dx, dy);
        if (d < -0.5) continue;
        const ring = Math.floor(Math.max(0, d) / CELL) + 1;
        const t = ring + (ring >= 2 ? ((hash(`${seed}-${x}-${y}`) % 7) / 7) * 1.3 : 0);
        const tone = t < 1.5 ? 0 : t < 2.5 ? 1 : t < 3.4 ? 3 : -1;
        if (tone < 0) continue;
        ctx.fillStyle = tones[tone];
        ctx.fillRect(cx, cy, CELL, CELL);
      }
  }

  // The veil drains from the centre outwards, cell by cell, like the cover.
  let vctx: CanvasRenderingContext2D | null = null;
  let vcols = 0;
  let vrows = 0;
  let vdist = new Float32Array(0);
  let vtones: (string | CanvasPattern)[] = [];
  function layoutVeil() {
    const r = screen.getBoundingClientRect();
    if (!r.width) return;
    vctx = size(veil, r.width, r.height);
    const [p0, p1] = patterns(vctx);
    vtones = [PALETTE.blue, p0, PALETTE.light, p1];
    vcols = Math.ceil(r.width / CELL);
    vrows = Math.ceil(r.height / CELL);
    vdist = new Float32Array(vcols * vrows);
    const sx = vcols / 2;
    const sy = vrows / 2;
    let max = 1;
    for (let i = 0; i < vdist.length; i++) {
      const x = i % vcols;
      const y = (i / vcols) | 0;
      vdist[i] = Math.abs(x - sx) + Math.abs(y - sy) + (hash(`${name}${i}`) % 4);
      max = Math.max(max, vdist[i]);
    }
    for (let i = 0; i < vdist.length; i++) vdist[i] /= max;
    drawVeil(revealed ? 1 : 0);
  }
  function drawVeil(p: number) {
    if (!vctx) return;
    vctx.clearRect(0, 0, veil.width, veil.height);
    for (let i = 0; i < vdist.length; i++) {
      const d = vdist[i];
      if (d < p) continue;
      const edge = d - p < 0.06 && p > 0;
      vctx.fillStyle = edge ? PALETTE.paper : vtones[Math.min(3, Math.floor(d * 4))];
      vctx.fillRect((i % vcols) * CELL, ((i / vcols) | 0) * CELL, CELL, CELL);
    }
  }
  function reveal() {
    if (revealed) return;
    revealed = true;
    if (reducedMotion.matches) {
      veil.hidden = true;
      return;
    }
    const start = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / DRAIN_MS);
      drawVeil(p * 1.08);
      if (p < 1) requestAnimationFrame(frame);
      else veil.hidden = true;
    };
    requestAnimationFrame(frame);
  }
  if (reducedMotion.matches) {
    revealed = true;
    veil.hidden = true;
  }

  new ResizeObserver(() => {
    fit();
    placeTicks();
    progress();
    paintRock();
    if (!veil.hidden) layoutVeil();
  }).observe(stage);

  new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (ratio >= 0.3) reveal();
      sync();
    },
    { threshold: [0, 0.3, 0.5, 0.75] },
  ).observe(video);

  screen.addEventListener('pointerenter', () => {
    if (!hoverable.matches) return;
    hover = true;
    reveal();
    sync();
  });
  screen.addEventListener('pointerleave', () => {
    hover = false;
    sync();
  });
  room.addEventListener('focusin', () => {
    focus = true;
    reveal();
    sync();
  });
  room.addEventListener('focusout', (event) => {
    if (room.contains(event.relatedTarget as Node)) return;
    focus = false;
    sync();
  });

  function play(on: boolean) {
    userPaused = !on;
    userPlay = on;
    reveal();
    sync();
  }
  toggle.addEventListener('click', () => play(video.paused));
  big.addEventListener('click', () => play(true));
  beats.forEach((b, i) =>
    b.addEventListener('click', () => {
      video.currentTime = chapters[i].t + 0.05;
      progress();
      play(true);
    }),
  );
  expand.addEventListener('click', () => {
    const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else v.webkitEnterFullscreen?.();
    play(true);
  });
  document.addEventListener('fullscreenchange', () => {
    video.controls = document.fullscreenElement === video;
  });

  video.addEventListener('loadedmetadata', () => {
    if (video.duration) duration = video.duration;
    placeTicks();
  });
  video.addEventListener('timeupdate', progress);
  video.addEventListener('seeked', progress);
  video.addEventListener('play', setLabel);
  video.addEventListener('pause', setLabel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else sync();
  });
  setLabel();
  progress();
}
