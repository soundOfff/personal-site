import type { ReelContext } from '../types';
import { paper } from './score';

type Point = { x: number; y: number };
type Pane =
  | { kind: 'fogged'; cells: Set<number>; stroke: { pointer: number; point: Point } | null }
  | { kind: 'clear' };

export function mountRainPane(ctx: ReelContext): () => void {
  const scene = document.querySelector<HTMLElement>('[data-opening="mood"]');
  const pane = scene?.querySelector<HTMLElement>('[data-mk-pane]');
  const canvas = pane?.querySelector<HTMLCanvasElement>('[data-mk-fog]');
  const button = pane?.querySelector<HTMLButtonElement>('[data-mk-clear]');
  const hint = pane?.querySelector<HTMLElement>('[data-mk-pane-hint]');
  const letter = scene?.querySelector<HTMLDetailsElement>('[data-opening-disclosure]');
  const glass = canvas?.getContext('2d');
  if (!pane || !canvas || !button || !hint || !letter || !glass) return () => {};

  let state: Pane = { kind: 'fogged', cells: new Set(), stroke: null };
  const paintFog = () => {
    glass.globalCompositeOperation = 'source-over';
    glass.clearRect(0, 0, 360, 300);
    const fog = glass.createLinearGradient(0, 0, 360, 300);
    fog.addColorStop(0, '#7b998e');
    fog.addColorStop(0.5, '#668d80f5');
    fog.addColorStop(1, '#b0af88f5');
    glass.fillStyle = fog;
    glass.fillRect(0, 0, 360, 300);
    for (let i = 0; i < 64; i++) {
      glass.fillStyle = i % 2 ? '#d5deca50' : '#1e52462b';
      glass.beginPath();
      glass.ellipse((i * 71) % 360, (i * 43) % 300, 1.3, 3 + (i % 5), 0, 0, Math.PI * 2);
      glass.fill();
    }
  };
  const clear = () => {
    if (state.kind === 'clear') return;
    const pointer = state.stroke?.pointer;
    state = { kind: 'clear' };
    if (pointer !== undefined && canvas.hasPointerCapture(pointer))
      canvas.releasePointerCapture(pointer);
    glass.clearRect(0, 0, 360, 300);
    pane.dataset.pane = 'clear';
    button.textContent = 'Open the letter ↗';
    hint.textContent = 'A letter is waiting on the table.';
    paper(ctx.sound);
  };
  const wipe = (point: Point) => {
    if (state.kind === 'clear') return;
    glass.globalCompositeOperation = 'destination-out';
    glass.fillStyle = '#000';
    glass.beginPath();
    glass.arc(point.x * 360, point.y * 300, 44, 0, Math.PI * 2);
    glass.fill();
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 12; col++) {
        const dx = ((col + 0.5) / 12 - point.x) * 360;
        const dy = ((row + 0.5) / 10 - point.y) * 300;
        if (dx * dx + dy * dy < 44 * 44) state.cells.add(row * 12 + col);
      }
    }
    if (state.cells.size >= 48) clear();
  };
  const pointAt = (event: PointerEvent): Point => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };
  const endStroke = (event: PointerEvent) => {
    if (state.kind === 'fogged' && state.stroke?.pointer === event.pointerId) state.stroke = null;
  };
  const on = { signal: ctx.signal };
  paintFog();
  pane.hidden = false;
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || !event.isPrimary || state.kind === 'clear') return;
      const point = pointAt(event);
      state.stroke = { pointer: event.pointerId, point };
      canvas.setPointerCapture(event.pointerId);
      wipe(point);
    },
    on,
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (state.kind === 'clear' || state.stroke?.pointer !== event.pointerId) return;
      const from = state.stroke.point;
      const to = pointAt(event);
      state.stroke.point = to;
      const steps = Math.ceil(Math.hypot((to.x - from.x) * 360, (to.y - from.y) * 300) / 12);
      for (let step = 1; step <= steps; step++) {
        wipe({
          x: from.x + ((to.x - from.x) * step) / steps,
          y: from.y + ((to.y - from.y) * step) / steps,
        });
      }
    },
    on,
  );
  canvas.addEventListener('pointerup', endStroke, on);
  canvas.addEventListener('pointercancel', endStroke, on);
  canvas.addEventListener('lostpointercapture', endStroke, on);
  button.addEventListener(
    'click',
    () => {
      if (state.kind === 'fogged') clear();
      else {
        letter.open = true;
        letter.querySelector('summary')?.focus({ preventScroll: true });
        paper(ctx.sound);
      }
    },
    on,
  );

  return () => {
    if (state.kind === 'fogged' && state.stroke && canvas.hasPointerCapture(state.stroke.pointer))
      canvas.releasePointerCapture(state.stroke.pointer);
    state = { kind: 'fogged', cells: new Set(), stroke: null };
    pane.hidden = true;
    delete pane.dataset.pane;
    button.textContent = 'Clear the glass ↗';
    hint.textContent = 'Wipe across the glass.';
    paintFog();
  };
}
