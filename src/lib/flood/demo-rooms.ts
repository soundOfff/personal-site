/**
 * The product demo rooms. A halo of cells surrounds each screen and its control bar, and the
 * first time a room comes into view a flood drains off the screen to reveal the recorded loop.
 *
 * A loop plays while at least half of it is in view, or while its room has the pointer or focus,
 * and pauses offscreen and in a hidden tab. Under reduced motion it waits for Play.
 */
import { haloTone, hash, jitter, noise, size, tones, type Tone } from './pixels';
import { reducedMotion } from './scroll';

const CELL = 20;
/** Halo cells beyond the clearing on each side. */
const MARGIN = 4;
const REVEAL_MS = 1100;

/** What the reader last asked for. Leaving the view forgets a play, never a pause. */
type Choice = 'none' | 'play' | 'pause';
/** Where the room's copy sits relative to its screen. */
type Side = 'left' | 'right' | 'top';

interface Cell {
  x: number;
  y: number;
  tone: number;
  /** When the cell appears (halo) or clears (wipe), in ms after the reveal starts. */
  at: number;
}

/** The halo around a clearing of `w`×`h` px, quieter on the copy's side and under the bar. */
function halo(w: number, h: number, copy: Side, seed: number): Cell[] {
  const cols = Math.ceil(w / CELL) + 2 * MARGIN;
  const rows = Math.ceil(h / CELL) + 2 * MARGIN;
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = (x - MARGIN + 0.5) * CELL;
      const cy = (y - MARGIN + 0.5) * CELL;
      let dx = Math.max(0, -cx, cx - w) / CELL;
      let dy = Math.max(0, -cy, cy - h) / CELL;
      if (!dx && !dy) continue;
      if ((copy === 'left' && cx < 0) || (copy === 'right' && cx > w)) dx *= 1.9;
      if (copy === 'top' && cy < 0) dy *= 1.9;
      if (cy > h) dy *= 2.2;
      const e = Math.max(dx, dy);
      const j = jitter(seed, x, y);
      const tone = haloTone(e, j);
      if (tone >= 0) cells.push({ x: x * CELL, y: y * CELL, tone, at: e * 90 + j * 160 });
    }
  }
  return cells;
}

/** The flood over a `w`×`h` px screen, draining outwards in blobs from just left of center. */
function wipe(w: number, h: number, seed: number): Cell[] {
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const field = noise(cols, rows, seed, 3);
  const far = Math.hypot(cols, rows) / 2 + 3;
  const cells: Cell[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.abs(x - cols * 0.42) + Math.abs(y - rows * 0.55);
      const at = 200 + (d / far) * 520 + field[y * cols + x] * 220;
      cells.push({ x: x * CELL, y: y * CELL, tone: 0, at });
    }
  }
  return cells;
}

function initRoom(room: HTMLElement) {
  const find = <T extends Element>(selector: string) => room.querySelector<T>(selector)!;
  const video = find<HTMLVideoElement>('video');
  const stage = find<HTMLElement>('[data-stage]');
  const clearing = find<HTMLElement>('[data-clearing]');
  const screen = find<HTMLElement>('[data-screen]');
  const haloCanvas = find<HTMLCanvasElement>('[data-halo]');
  const wipeCanvas = find<HTMLCanvasElement>('[data-wipe]');
  const heading = find<HTMLElement>('h3');
  const captionN = find<HTMLElement>('[data-caption-n]');
  const captionLabel = find<HTMLElement>('[data-caption-label]');
  const play = find<HTMLButtonElement>('[data-play]');
  const big = find<HTMLButtonElement>('[data-big]');
  const expand = find<HTMLButtonElement>('[data-expand]');
  const beats = [...room.querySelectorAll<HTMLButtonElement>('[data-beat]')];
  const track = [...room.querySelectorAll<HTMLElement>('[data-cell]')];
  const name = room.dataset.name!;
  const chapters = JSON.parse(room.dataset.chapters!) as { t: number; label: string }[];
  const duration = Number(room.dataset.duration);
  const still = () => reducedMotion.matches;

  let ratio = 0;
  let hover = false;
  let focus = false;
  let choice: Choice = 'none';
  let chapter = -1;
  let revealAt = -1;
  let frame = 0;

  function wants() {
    if (ratio <= 0 || choice === 'pause' || document.hidden) return false;
    return choice === 'play' || (!still() && (ratio >= 0.5 || hover || focus));
  }
  function sync() {
    // play() rejects when a pause interrupts it. The play and pause events keep the controls right.
    if (!wants()) {
      if (!video.paused) video.pause();
    } else if (video.paused) video.play().catch(() => {});
  }
  function choose(next: Choice) {
    choice = next;
    sync();
  }

  function show(t: number) {
    const lit = Math.round((t / duration) * track.length);
    track.forEach((cell, i) => cell.classList.toggle('on', i <= lit));
    const c = Math.max(
      0,
      chapters.findLastIndex((beat) => t + 0.05 >= beat.t),
    );
    if (c === chapter) return;
    chapter = c;
    captionN.textContent = String(c + 1).padStart(2, '0');
    captionLabel.textContent = chapters[c].label;
    beats.forEach((beat, i) =>
      i === c ? beat.setAttribute('aria-current', 'step') : beat.removeAttribute('aria-current'),
    );
  }

  function setPlaying() {
    const on = !video.paused;
    room.classList.toggle('is-playing', on);
    play.setAttribute('aria-label', `${on ? 'Pause' : 'Play'} the ${name} demo`);
    big.hidden = on || choice === 'play' || !still();
  }

  let haloCtx: CanvasRenderingContext2D | undefined;
  let wipeCtx: CanvasRenderingContext2D;
  let haloFills: Tone[] = [];
  let wipeFills: Tone[] = [];
  let rim: Cell[] = [];
  let cover: Cell[] = [];

  // The halo canvas is snapped to the clearing, so its cells line up with the screen's edges.
  function layout() {
    const w = clearing.offsetWidth;
    const h = clearing.offsetHeight;
    if (!w) return;
    const pad = MARGIN * CELL;
    Object.assign(haloCanvas.style, {
      left: `${clearing.offsetLeft - pad}px`,
      top: `${clearing.offsetTop - pad}px`,
      width: `${w + 2 * pad}px`,
      height: `${h + 2 * pad}px`,
    });
    haloCtx = size(haloCanvas, w + 2 * pad, h + 2 * pad);
    haloFills = tones(haloCtx);
    const s = screen.getBoundingClientRect();
    const title = heading.getBoundingClientRect();
    const copy: Side = title.right <= s.left ? 'left' : title.left >= s.right ? 'right' : 'top';
    rim = halo(w, h, copy, hash(room.id));
    wipeCtx = size(wipeCanvas, screen.offsetWidth, screen.offsetHeight);
    wipeFills = tones(wipeCtx);
    cover = wipe(screen.offsetWidth, screen.offsetHeight, hash(`${room.id}:wipe`));
    paint(performance.now());
  }

  function paint(now: number) {
    if (!haloCtx) return;
    const t = still() ? Infinity : revealAt < 0 ? -1 : now - revealAt;
    haloCtx.clearRect(0, 0, haloCanvas.width, haloCanvas.height);
    for (const c of rim) {
      if (t < c.at) continue;
      // Each cell lands light and settles into its tone.
      const age = t - c.at;
      haloCtx.fillStyle = haloFills[Math.min(3, c.tone + (age < 120 ? 2 : age < 220 ? 1 : 0))];
      haloCtx.fillRect(c.x, c.y, CELL, CELL);
    }
    wipeCtx.clearRect(0, 0, wipeCanvas.width, wipeCanvas.height);
    if (t === Infinity) return;
    for (const c of cover) {
      const left = c.at - Math.max(0, t);
      if (left <= 0) continue;
      // Draining cells step blue, dither, light, dither, gone.
      wipeCtx.fillStyle = wipeFills[left > 240 ? 0 : left > 160 ? 1 : left > 80 ? 2 : 3];
      wipeCtx.fillRect(c.x, c.y, CELL, CELL);
    }
  }

  function animate(now: number) {
    frame = 0;
    paint(now);
    if (now - revealAt < REVEAL_MS) frame = requestAnimationFrame(animate);
  }

  video.addEventListener('timeupdate', () => show(video.currentTime));
  video.addEventListener('seeked', () => show(video.currentTime));
  video.addEventListener('play', setPlaying);
  video.addEventListener('pause', setPlaying);
  play.addEventListener('click', () => choose(video.paused ? 'play' : 'pause'));
  big.addEventListener('click', () => {
    choose('play');
    play.focus();
  });
  expand.addEventListener('click', () => {
    const v = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    // A refused full screen leaves the demo playing in place.
    if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
    else v.webkitEnterFullscreen?.();
    choose('play');
  });
  document.addEventListener('fullscreenchange', () => {
    video.controls = document.fullscreenElement === video;
  });
  document.addEventListener('visibilitychange', sync);
  beats.forEach((beat, i) =>
    beat.addEventListener('click', () => {
      const t = chapters[i].t + 0.05;
      video.currentTime = t;
      show(t);
      choose('play');
    }),
  );

  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  room.addEventListener('pointerenter', (event) => {
    hover = event.pointerType === 'mouse' && fine.matches;
    sync();
  });
  room.addEventListener('pointerleave', () => {
    hover = false;
    sync();
  });
  room.addEventListener('focusin', () => {
    focus = true;
    sync();
  });
  room.addEventListener('focusout', (event) => {
    focus = room.contains(event.relatedTarget as Node);
    sync();
  });

  new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (!ratio) {
        if (choice === 'play') choice = 'none';
        hover = false;
      }
      sync();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  ).observe(video);
  const reveal = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting || still()) return;
      reveal.disconnect();
      revealAt = performance.now();
      frame = requestAnimationFrame(animate);
    },
    { threshold: 0.3 },
  );
  reveal.observe(stage);
  reducedMotion.addEventListener('change', () => {
    // After a preference change, a room that has not revealed yet shows its final state.
    if (revealAt < 0) {
      reveal.disconnect();
      revealAt = 0;
    }
    cancelAnimationFrame(frame);
    paint(performance.now());
    sync();
    setPlaying();
  });
  new ResizeObserver(layout).observe(stage);
  show(0);
  setPlaying();
}

export function initDemoRooms() {
  document.querySelectorAll<HTMLElement>('[data-room]').forEach(initRoom);
}
