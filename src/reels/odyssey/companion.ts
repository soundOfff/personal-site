import type { ReelContext } from '../types';
import { SECTION_IDS } from '../types';
import { OBSERVATIONS, isObservationEvent, type ObservationEvent } from './observations';

let observationCalls = 0;
const VOICE_KEY = 'tb-hal-voice';
type CompanionView = 'idle' | 'remark' | 'open';

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
  const popover = panel?.querySelector<HTMLElement>('[data-hal-popover]');
  const toggle = panel?.querySelector<HTMLButtonElement>('[data-hal-toggle]');
  const close = panel?.querySelector<HTMLButtonElement>('[data-hal-companion-close]');
  const line = panel?.querySelector<HTMLElement>('[data-hal-comment]');
  const announcement = panel?.querySelector<HTMLElement>('[data-hal-announcement]');
  const source = panel?.querySelector<HTMLElement>('[data-hal-source]');
  const pause = panel?.querySelector<HTMLButtonElement>('[data-hal-pause]');
  const chat = panel?.querySelector<HTMLButtonElement>('[data-hal-chat]');
  const eye = panel?.querySelector<HTMLElement>('[data-hal-companion-eye]');
  const voice = panel?.querySelector<HTMLButtonElement>('[data-hal-companion-voice]');
  if (
    !panel ||
    !popover ||
    !toggle ||
    !close ||
    !line ||
    !announcement ||
    !source ||
    !pause ||
    !chat ||
    !eye ||
    !voice
  )
    return () => {};
  const home = panel.parentNode;
  document.body.appendChild(panel);
  const lifetime = new AbortController();
  const on = { signal: lifetime.signal };
  let view: CompanionView = 'idle';
  let mode: 'watching' | 'paused' = 'watching';
  let heroVisible = true;
  let voiceEnabled = true;
  let timer = 0;
  let sectionTimer = 0;
  let hoverTimer = 0;
  let hideTimer = 0;
  let eyeFrame = 0;
  let pending: AbortController | null = null;
  let revision = 0;
  let lastComment = 0;
  let lastAttempt = 0;
  let lastEvent: ObservationEvent | null = null;
  const visits = new Map<ObservationEvent, number>();
  try {
    voiceEnabled = localStorage.getItem(VOICE_KEY) !== 'off';
  } catch {
    voiceEnabled = true;
  }
  const renderView = (next: CompanionView) => {
    view = next;
    panel.dataset.state = next;
    popover.inert = next !== 'open';
    toggle.setAttribute('aria-expanded', String(next === 'open'));
    toggle.setAttribute(
      'aria-label',
      next === 'open' ? 'Close HAL companion' : 'Open HAL companion',
    );
  };
  const dismiss = (focus = false) => {
    window.clearTimeout(hideTimer);
    renderView('idle');
    if (focus) toggle.focus({ preventScroll: true });
  };
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
  const cancel = () => {
    window.clearTimeout(timer);
    window.clearTimeout(sectionTimer);
    window.clearTimeout(hoverTimer);
    pending?.abort();
    pending = null;
    revision += 1;
  };
  const available = () =>
    !ctx.signal.aborted &&
    !heroVisible &&
    !document.hidden &&
    !dialog.open &&
    !document.querySelector('dialog[open]:not(#hal-dialog)') &&
    !ctx.root.hasAttribute('data-boxoffice') &&
    !document.querySelector<HTMLElement>('[data-projector]')?.dataset.state;
  const sync = () => {
    panel.hidden = !available();
    if (panel.hidden) {
      cancel();
      dismiss();
      args.stopVoice();
    }
  };
  const present = (text: string, ai: boolean, event: ObservationEvent) => {
    line.textContent = text;
    announcement.textContent = text;
    source.textContent = ai ? 'AI observation' : 'Page observation';
    lastComment = Date.now();
    lastEvent = event;
    renderView('remark');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(
      () => {
        if (view === 'remark') dismiss();
      },
      Math.max(6000, text.length * 55),
    );
    if (voiceEnabled && !ctx.sound.muted) args.speak(text);
  };
  const observe = (event: ObservationEvent) => {
    if (mode === 'paused' || !available() || view === 'open') return;
    if (
      Date.now() - lastComment < 14_000 ||
      (event === lastEvent && Date.now() - lastComment < 45_000)
    )
      return;
    cancel();
    const version = revision;
    timer = window.setTimeout(
      async () => {
        if (!available() || mode === 'paused' || view === 'open' || version !== revision) return;
        const remarks = OBSERVATIONS[event].lines;
        const visit = visits.get(event) ?? 0;
        visits.set(event, visit + 1);
        let text: string = remarks[visit % remarks.length] ?? remarks[0];
        let ai = false;
        if (observationCalls < 3 && Date.now() - lastAttempt >= 21_000) {
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
              typeof result === 'object' &&
              result !== null &&
              'text' in result &&
              typeof result.text === 'string' &&
              result.text.trim() &&
              result.text.length <= 180
            ) {
              text = result.text.trim();
              ai = true;
            }
          } catch {
            ai = false;
          } finally {
            window.clearTimeout(timeout);
            if (pending === controller) pending = null;
          }
        }
        if (available() && mode === 'watching' && version === revision) present(text, ai, event);
      },
      1100 + Math.random() * 1500,
    );
  };
  const eventFor = (target: Element): ObservationEvent | null => {
    if (target.closest('[data-hal-companion], #hal-dialog')) return null;
    if (target.closest('[data-boxoffice-open], [data-reel-pick]')) return 'films';
    const link = target.closest<HTMLAnchorElement>('a');
    if (!link) return null;
    if (link.protocol === 'mailto:') return 'contact';
    if (link.origin !== location.origin) return 'external';
    const section = link.hash.slice(1);
    if (isObservationEvent(section)) return section;
    if (link.pathname.startsWith('/blog')) return 'writing';
    if (link.pathname.startsWith('/work')) return 'work';
    return null;
  };
  document.addEventListener(
    'pointerover',
    (event) => {
      if (!(event.target instanceof Element)) return;
      window.clearTimeout(hoverTimer);
      const target = eventFor(event.target);
      if (target) hoverTimer = window.setTimeout(() => observe(target), 750);
    },
    { ...on, passive: true },
  );
  document.addEventListener('pointerout', () => window.clearTimeout(hoverTimer), {
    ...on,
    passive: true,
  });
  document.addEventListener(
    'focusin',
    (event) => {
      if (!(event.target instanceof Element)) return;
      const target = eventFor(event.target);
      if (target) observe(target);
    },
    on,
  );
  const offSections = ctx.onSection((index) => {
    cancel();
    const section = SECTION_IDS[index];
    if (isObservationEvent(section)) sectionTimer = window.setTimeout(() => observe(section), 1700);
  });
  toggle.addEventListener(
    'click',
    () => {
      if (view === 'open') dismiss();
      else {
        cancel();
        window.clearTimeout(hideTimer);
        renderView('open');
      }
    },
    on,
  );
  close.addEventListener('click', () => dismiss(true), on);
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && view === 'open') {
        event.preventDefault();
        dismiss(true);
      }
    },
    on,
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (view === 'open' && event.target instanceof Node && !panel.contains(event.target))
        dismiss();
    },
    on,
  );
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
  chat.addEventListener(
    'click',
    () => {
      cancel();
      toggle.focus({ preventScroll: true });
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
    if (!heroVisible) {
      const section = SECTION_IDS[ctx.section()];
      if (isObservationEvent(section)) observe(section);
    }
  });
  hero.observe(scene);
  const mutation = new MutationObserver(sync);
  mutation.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['open'] });
  mutation.observe(ctx.root, { attributes: true, attributeFilter: ['data-boxoffice'] });
  const projector = document.querySelector('[data-projector]');
  if (projector) mutation.observe(projector, { attributes: true, attributeFilter: ['data-state'] });
  document.addEventListener('visibilitychange', sync, on);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  if (!ctx.reducedMotion)
    document.addEventListener(
      'pointermove',
      (event) => {
        if (panel.hidden || !fine.matches || eyeFrame) return;
        const x = event.clientX;
        const y = event.clientY;
        eyeFrame = requestAnimationFrame(() => {
          eyeFrame = 0;
          if (ctx.signal.aborted) return;
          const rect = eye.getBoundingClientRect();
          eye.style.setProperty(
            '--eye-x',
            `${Math.max(-3, Math.min(3, (x - rect.left - rect.width / 2) / 80))}px`,
          );
          eye.style.setProperty(
            '--eye-y',
            `${Math.max(-3, Math.min(3, (y - rect.top - rect.height / 2) / 80))}px`,
          );
        });
      },
      { ...on, passive: true },
    );
  line.textContent = OBSERVATIONS.arrival.lines[0];
  source.textContent = 'Page observation';
  pause.textContent = 'Pause remarks';
  pause.setAttribute('aria-pressed', 'false');
  renderView('idle');
  renderVoice();
  sync();
  return () => {
    cancel();
    window.clearTimeout(hideTimer);
    cancelAnimationFrame(eyeFrame);
    lifetime.abort();
    hero.disconnect();
    mutation.disconnect();
    offSections();
    offSound();
    args.stopVoice();
    panel.hidden = true;
    dismiss();
    announcement.textContent = '';
    panel.querySelector('details')?.removeAttribute('open');
    eye.removeAttribute('style');
    home?.appendChild(panel);
  };
}
