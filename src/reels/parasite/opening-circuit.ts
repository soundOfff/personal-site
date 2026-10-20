import type { ReelContext } from '../types';
import { beep, lamp } from './score';

type Circuit = 'upstairs' | 'signaling' | 'basement';

export function mountHouseCircuit(ctx: ReelContext): () => void {
  const scene = document.querySelector<HTMLElement>('[data-opening="parasite"]');
  const plate = scene?.querySelector<HTMLElement>('[data-ps-circuit]');
  const power = scene?.querySelector<HTMLInputElement>('[data-ps-power]');
  const status = scene?.querySelector<HTMLElement>('[data-ps-circuit-status]');
  const clue = scene?.querySelector<HTMLElement>('.ps-closed-label');
  if (!scene || !plate || !power || !status || !clue) return () => {};

  const initialClue = clue.textContent;
  const initialStatus = status.textContent;
  const timers = new Set<number>();
  const cancelSignal = () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
    delete scene.dataset.psPulse;
  };
  const later = (action: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      action();
    }, delay);
    timers.add(timer);
  };
  const render = (circuit: Circuit) => {
    scene.dataset.psCircuit = circuit;
    power.checked = circuit !== 'upstairs';
    clue.textContent = circuit === 'basement' ? 'B1 answered. Go below ↓' : initialClue;
    status.textContent = {
      upstairs: '1F · The house is quiet.',
      signaling: 'B1 · A signal from below…',
      basement: 'B1 · −··· ·−−−−. Another floor.',
    }[circuit];
  };
  power.checked = false;
  plate.hidden = false;
  render('upstairs');
  power.addEventListener(
    'change',
    () => {
      cancelSignal();
      lamp(ctx.sound, power.checked ? 3 : 0);
      if (!power.checked) {
        render('upstairs');
        return;
      }
      if (ctx.reducedMotion) {
        render('basement');
        return;
      }
      render('signaling');
      let time = 120;
      for (const letter of ['-...', '.----']) {
        for (const symbol of letter) {
          const duration = symbol === '.' ? 85 : 255;
          later(() => {
            scene.dataset.psPulse = 'on';
            beep(ctx.sound, duration / 1000);
          }, time);
          later(() => delete scene.dataset.psPulse, time + duration);
          time += duration + 85;
        }
        time += 170;
      }
      later(() => render('basement'), time);
    },
    { signal: ctx.signal },
  );

  return () => {
    cancelSignal();
    power.checked = false;
    plate.hidden = true;
    clue.textContent = initialClue;
    status.textContent = initialStatus;
    delete scene.dataset.psCircuit;
  };
}
