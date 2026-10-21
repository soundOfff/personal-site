import type { ReelContext } from '../types';
import { SECTION_IDS } from '../types';
import { OBSERVATIONS, isObservationEvent, type ObservationEvent } from './observations';

let observationCalls = 0;
const VOICE_KEY = 'tb-hal-voice';

export function mountCompanion(args: {
  ctx: ReelContext;
  scene: HTMLElement;
  dialog: HTMLDialogElement;
  open: () => void;
  speak: (text: string) => void;
  stopVoice: () => void;
}) {
  const { ctx, scene, dialog } = args;
  const panel = document.querySelector<HTMLElement>('[data-hal-companion]');
  const line = panel?.querySelector<HTMLElement>('[data-hal-comment]');
  const source = panel?.querySelector<HTMLElement>('[data-hal-source]');
  const pause = panel?.querySelector<HTMLButtonElement>('[data-hal-pause]');
  const minimize = panel?.querySelector<HTMLButtonElement>('[data-hal-minimize]');
  const chat = panel?.querySelector<HTMLButtonElement>('[data-hal-chat]');
  const eye = panel?.querySelector<HTMLElement>('[data-hal-companion-eye]');
  const voice = panel?.querySelector<HTMLButtonElement>('[data-hal-companion-voice]');
  if (!panel || !line || !source || !pause || !minimize || !chat || !eye || !voice) return () => {};
  panel.removeAttribute('data-minimized');
  minimize.textContent = 'Minimize';
  minimize.setAttribute('aria-expanded', 'true');
  pause.textContent = 'Pause remarks';
  pause.setAttribute('aria-pressed', 'false');
  line.textContent = OBSERVATIONS.arrival.line;
  source.textContent = 'Shipboard remark';
  const home = panel.parentNode;
  document.body.appendChild(panel);
  const lifetime = new AbortController();
  const on = { signal: lifetime.signal };
  type Mode = 'watching' | 'paused';
  let mode: Mode = 'watching';
  let heroVisible = true;
  let voiceEnabled = true;
  try {
    voiceEnabled = localStorage.getItem(VOICE_KEY) !== 'off';
  } catch {
    voiceEnabled = true;
  }
  const voiceSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const renderVoice = () => {
    const audible = voiceEnabled && !ctx.sound.muted;
    voice.disabled = !voiceSupported;
    voice.textContent = voiceSupported
      ? audible
        ? 'Mute HAL'
        : 'Unmute HAL'
      : 'Voice unavailable';
    voice.setAttribute('aria-pressed', String(audible));
  };
  const offSound = ctx.sound.onChange((muted) => {
    if (muted) args.stopVoice();
    renderVoice();
  });
  renderVoice();
  let timer = 0;
  let sectionTimer = 0;
  let pending: AbortController | null = null;
  let revision = 0;
  let lastComment = 0;
  let lastAttempt = 0;
  let lastEvent: ObservationEvent = 'arrival';
  const cancel = () => {
    window.clearTimeout(timer);
    window.clearTimeout(sectionTimer);
    pending?.abort();
    pending = null;
    revision += 1;
  };
  const available = () =>
    !ctx.signal.aborted &&
    !document.hidden &&
    !dialog.open &&
    !ctx.root.hasAttribute('data-boxoffice') &&
    !document.querySelector<HTMLElement>('[data-projector]')?.dataset.state;
  const sync = () => {
    panel.hidden = heroVisible || !available();
    if (!available()) {
      cancel();
      args.stopVoice();
    }
  };
  const present = (text: string, ai: boolean) => {
    line.textContent = text;
    source.textContent = ai ? 'AI observation' : 'Shipboard remark';
    if (voiceEnabled && !ctx.sound.muted) args.speak(text);
  };
  const observe = (event: ObservationEvent) => {
    if (mode === 'paused' || !available() || event === lastEvent) return;
    if (Date.now() - lastComment < 9000) return;
    cancel();
    lastComment = Date.now();
    lastEvent = event;
    present(OBSERVATIONS[event].line, false);
    if (observationCalls >= 3 || Date.now() - lastAttempt < 21_000) return;
    const version = revision;
    timer = window.setTimeout(async () => {
      if (!available() || mode === 'paused' || version !== revision) return;
      observationCalls += 1;
      lastAttempt = Date.now();
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch('/api/hal-observe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event }),
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (
          response.ok &&
          available() &&
          mode === 'watching' &&
          version === revision &&
          typeof result === 'object' &&
          result !== null &&
          'text' in result &&
          typeof result.text === 'string' &&
          result.text.trim() &&
          result.text.length <= 180
        ) {
          present(result.text.trim(), true);
        }
      } catch {
        return;
      } finally {
        window.clearTimeout(timeout);
        if (pending === controller) pending = null;
      }
    }, 1300);
  };
  const eventFor = (target: Element): ObservationEvent | null => {
    if (target.closest('[data-boxoffice-open], [data-reel-pick]')) return 'films';
    const link = target.closest<HTMLAnchorElement>('a');
    if (!link || link.closest('[data-hal-companion], #hal-dialog')) return null;
    if (link.protocol === 'mailto:') return 'contact';
    if (link.origin !== location.origin) return 'external';
    const section = link.hash.slice(1);
    return isObservationEvent(section) ? section : null;
  };
  const interact = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const target = eventFor(event.target);
    if (target) observe(target);
  };
  document.addEventListener('pointerover', interact, { ...on, passive: true });
  document.addEventListener('focusin', interact, on);
  const offSections = ctx.onSection((index) => {
    const section = SECTION_IDS[index];
    window.clearTimeout(sectionTimer);
    if (isObservationEvent(section)) sectionTimer = window.setTimeout(() => observe(section), 650);
  });
  pause.addEventListener(
    'click',
    () => {
      mode = mode === 'watching' ? 'paused' : 'watching';
      pause.textContent = mode === 'paused' ? 'Resume remarks' : 'Pause remarks';
      pause.setAttribute('aria-pressed', String(mode === 'paused'));
      if (mode === 'paused') {
        cancel();
        args.stopVoice();
      }
    },
    on,
  );
  minimize.addEventListener(
    'click',
    () => {
      const compact = panel.toggleAttribute('data-minimized');
      minimize.textContent = compact ? 'Expand' : 'Minimize';
      minimize.setAttribute('aria-expanded', String(!compact));
    },
    on,
  );
  chat.addEventListener(
    'click',
    () => {
      cancel();
      args.open();
      sync();
    },
    on,
  );
  voice.addEventListener(
    'click',
    () => {
      voiceEnabled = !voiceEnabled || ctx.sound.muted;
      if (voiceEnabled) {
        ctx.sound.setMuted(false);
        args.speak(line.textContent ?? '');
      } else args.stopVoice();
      renderVoice();
      try {
        localStorage.setItem(VOICE_KEY, voiceEnabled ? 'on' : 'off');
      } catch {
        return;
      }
    },
    on,
  );
  const hero = new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    sync();
  });
  hero.observe(scene);
  const mutation = new MutationObserver(sync);
  mutation.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  mutation.observe(ctx.root, { attributes: true, attributeFilter: ['data-boxoffice'] });
  const projector = document.querySelector('[data-projector]');
  if (projector) mutation.observe(projector, { attributes: true, attributeFilter: ['data-state'] });
  document.addEventListener('visibilitychange', sync, on);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (!ctx.reducedMotion)
    document.addEventListener(
      'pointermove',
      (event) => {
        if (panel.hidden || !fine.matches) return;
        const rect = eye.getBoundingClientRect();
        const x = Math.max(-4, Math.min(4, (event.clientX - rect.left - rect.width / 2) / 65));
        const y = Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) / 65));
        eye.style.setProperty('--eye-x', `${x}px`);
        eye.style.setProperty('--eye-y', `${y}px`);
      },
      { ...on, passive: true },
    );
  sync();
  return () => {
    cancel();
    lifetime.abort();
    hero.disconnect();
    mutation.disconnect();
    offSections();
    offSound();
    panel.hidden = true;
    panel.removeAttribute('data-minimized');
    eye.removeAttribute('style');
    home?.appendChild(panel);
  };
}
