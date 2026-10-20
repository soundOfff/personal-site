import type { ReelContext } from '../types';
import { clunk, lensHum, transmission, type Hum } from './score';
import { mountVoice } from './voice';

type Exchange = Readonly<{ question: string; answer: string }>;
type Quota = Readonly<{ remaining: number; limit: number }>;
type Problem = 'limited' | 'unavailable' | 'timeout' | 'connection';
type Conversation =
  | { kind: 'closed' }
  | { kind: 'ready' }
  | { kind: 'waiting'; controller: AbortController; question: string }
  | { kind: 'failed'; problem: Problem; retryAfter: number };
type Outcome =
  | { kind: 'reply'; text: string; quota: Quota }
  | { kind: 'problem'; problem: Problem; retryAfter: number; quota: Quota | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readQuota(value: unknown): Quota | null {
  if (!isRecord(value)) return null;
  const { remaining, limit } = value;
  return typeof remaining === 'number' &&
    Number.isInteger(remaining) &&
    typeof limit === 'number' &&
    Number.isInteger(limit) &&
    limit > 0 &&
    remaining >= 0 &&
    remaining <= limit
    ? { remaining, limit }
    : null;
}

async function requestReply(args: {
  question: string;
  exchanges: readonly Exchange[];
  signal: AbortSignal;
}): Promise<Outcome> {
  try {
    const response = await fetch('/api/hal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: args.question, exchanges: args.exchanges }),
      signal: args.signal,
    });
    const raw: unknown = await response.json();
    if (!isRecord(raw))
      return { kind: 'problem', problem: 'unavailable', retryAfter: 0, quota: null };
    const quota = readQuota(raw.quota);
    if (
      response.ok &&
      typeof raw.text === 'string' &&
      raw.text.trim() &&
      raw.text.length <= 400 &&
      quota
    ) {
      return { kind: 'reply', text: raw.text.trim(), quota };
    }
    const problem =
      raw.error === 'limited' ? 'limited' : raw.error === 'timeout' ? 'timeout' : 'unavailable';
    const retryAfter = Number(response.headers.get('retry-after'));
    return {
      kind: 'problem',
      problem,
      retryAfter: Number.isFinite(retryAfter) ? Math.max(0, Math.ceil(retryAfter)) : 0,
      quota,
    };
  } catch {
    return { kind: 'problem', problem: 'connection', retryAfter: 0, quota: null };
  }
}

export function mountHal(ctx: ReelContext): () => void {
  const scene = document.querySelector<HTMLElement>('[data-opening="odyssey"]');
  const first = scene?.querySelector<HTMLElement>('.ok-first');
  const lens = scene?.querySelector<HTMLButtonElement>('[data-hal-open]');
  const glass = scene?.querySelector<SVGElement>('[data-hal-glass]');
  const dialog = scene?.querySelector<HTMLDialogElement>('#hal-dialog');
  const form = dialog?.querySelector<HTMLFormElement>('[data-hal-form]');
  const input = form?.querySelector<HTMLInputElement>('input');
  const send = form?.querySelector<HTMLButtonElement>('[type="submit"]');
  const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-hal-close]');
  const log = dialog?.querySelector<HTMLElement>('[data-hal-log]');
  const status = dialog?.querySelector<HTMLElement>('[data-hal-status]');
  const quotaLabel = dialog?.querySelector<HTMLElement>('[data-hal-quota]');
  const greetingLabel = scene?.querySelector<HTMLElement>('[data-hal-greeting]');
  const voiceButton = dialog?.querySelector<HTMLButtonElement>('[data-hal-voice]');
  const voiceStatus = dialog?.querySelector<HTMLElement>('[data-hal-voice-status]');
  if (
    !scene ||
    !first ||
    !lens ||
    !glass ||
    !dialog ||
    !form ||
    !input ||
    !send ||
    !closeButton ||
    !log ||
    !status ||
    !quotaLabel ||
    !greetingLabel ||
    !voiceButton ||
    !voiceStatus
  )
    return () => {};

  const lifetime = new AbortController();
  const on = { signal: lifetime.signal };
  let conversation: Conversation = { kind: 'closed' };
  let exchanges: readonly Exchange[] = [];
  let quota: Quota | null = null;
  let hum: Hum | null = null;
  let disposed = false;
  let eyeFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const greeting = greetingLabel.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  let latestText = greeting;
  const voice = mountVoice({
    sound: ctx.sound,
    button: voiceButton,
    status: voiceStatus,
    indicator: scene,
    latestText: () => latestText,
  });
  const available = () =>
    !disposed && !document.hidden && scene.hasAttribute('data-opening-interactive');
  const stopHum = () => {
    hum?.stop(0.2);
    hum = null;
  };
  const resetEye = () => {
    cancelAnimationFrame(eyeFrame);
    eyeFrame = 0;
    glass.style.removeProperty('--hal-x');
    glass.style.removeProperty('--hal-y');
  };
  const focusNavigation = () => {
    const navigation = [
      ...document.querySelectorAll<HTMLElement>(
        '.rail [data-reel-pick], .rail [data-boxoffice-open], .rail .id',
      ),
    ].find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        !element.closest('[inert]') &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight
      );
    });
    navigation?.focus({ preventScroll: true });
  };
  const render = () => {
    const open = conversation.kind !== 'closed';
    lens.setAttribute('aria-expanded', String(open));
    first.toggleAttribute('data-hal-active', open);
    if (open && !dialog.open) dialog.show();
    if (!open && dialog.open) dialog.close();
    send.disabled = conversation.kind === 'waiting' || quota?.remaining === 0;
    input.readOnly = conversation.kind === 'waiting';
    form.setAttribute('aria-busy', String(conversation.kind === 'waiting'));
    if (conversation.kind === 'waiting') status.textContent = 'Receiving your transmission…';
    else if (conversation.kind === 'failed') {
      const messages: Record<Problem, string> = {
        limited: 'Shared allowance reached.',
        unavailable: 'HAL is unavailable. No AI reply was received.',
        timeout: 'HAL took too long to answer.',
        connection: 'Connection lost. No AI reply was received.',
      };
      status.textContent = `${messages[conversation.problem]}${conversation.retryAfter ? ` Try again in ${conversation.retryAfter} seconds.` : ' You can try Send again.'}`;
    } else
      status.textContent =
        quota?.remaining === 0
          ? 'Shared daily allowance reached. Come back tomorrow.'
          : 'Standing by.';
    quotaLabel.textContent = quota
      ? `${quota.remaining} of ${quota.limit} turns left today, shared with Playground. AI replies on Send.`
      : '5 daily turns shared with Playground. AI replies on Send.';
  };
  const append = (speaker: string, text: string) => {
    const entry = document.createElement('p');
    const label = document.createElement('b');
    label.textContent = speaker;
    const content = document.createElement('span');
    content.textContent = text;
    entry.appendChild(label);
    entry.appendChild(content);
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  };
  append('HAL', greeting);

  const close = (explicit: boolean) => {
    const pending = conversation.kind === 'waiting' ? conversation.controller : null;
    const focusedHere = first.contains(document.activeElement);
    conversation = { kind: 'closed' };
    pending?.abort();
    stopHum();
    voice.stop();
    render();
    if (explicit && available()) lens.focus({ preventScroll: true });
    else if (focusedHere) focusNavigation();
  };
  const syncAvailability = () => {
    if (!available()) {
      close(false);
      resetEye();
      first.inert = true;
    } else first.inert = false;
  };
  lens.addEventListener(
    'click',
    () => {
      if (!available() || conversation.kind !== 'closed') return;
      conversation = { kind: 'ready' };
      render();
      clunk(ctx.sound);
      input.focus({ preventScroll: true });
      voice.speak(greeting);
    },
    on,
  );
  closeButton.addEventListener('click', () => close(true), on);
  dialog.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      close(true);
    },
    on,
  );
  dialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      close(true);
    },
    on,
  );
  dialog.querySelectorAll<HTMLButtonElement>('[data-hal-suggest]').forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        if (conversation.kind === 'waiting') return;
        input.value = button.dataset.halSuggest ?? '';
        input.focus({ preventScroll: true });
      },
      on,
    );
  });
  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (
        !available() ||
        conversation.kind === 'closed' ||
        conversation.kind === 'waiting' ||
        !question ||
        question.length > 400 ||
        quota?.remaining === 0
      )
        return;
      const controller = new AbortController();
      conversation = { kind: 'waiting', controller, question };
      voice.stop();
      render();
      clunk(ctx.sound);
      hum = lensHum(ctx.sound, controller.signal);
      const outcome = await requestReply({ question, exchanges, signal: controller.signal });
      if (
        disposed ||
        !available() ||
        conversation.kind !== 'waiting' ||
        conversation.controller !== controller
      )
        return;
      stopHum();
      if (outcome.kind === 'reply') {
        exchanges = [...exchanges, { question, answer: outcome.text }].slice(-3);
        quota = outcome.quota;
        append('You', question);
        append('HAL', outcome.text);
        latestText = outcome.text;
        voice.speak(outcome.text);
        while (log.children.length > 6) log.firstElementChild?.remove();
        input.value = '';
        conversation = { kind: 'ready' };
        transmission(ctx.sound, 1);
      } else {
        quota = outcome.quota ?? quota;
        conversation = { kind: 'failed', problem: outcome.problem, retryAfter: outcome.retryAfter };
      }
      render();
    },
    on,
  );
  const observer = new MutationObserver(syncAvailability);
  observer.observe(scene, { attributes: true, attributeFilter: ['data-opening-interactive'] });
  document.addEventListener('visibilitychange', syncAvailability, on);
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!ctx.reducedMotion) {
    window.addEventListener(
      'pointermove',
      (event) => {
        if (!finePointer.matches || !available()) return;
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (eyeFrame) return;
        eyeFrame = requestAnimationFrame(() => {
          eyeFrame = 0;
          const rect = lens.getBoundingClientRect();
          const dx = pointerX - (rect.left + rect.width / 2);
          const dy = pointerY - (rect.top + rect.height / 2);
          const distance = Math.max(1, Math.hypot(dx, dy));
          const reach = Math.min(1, distance / 420) * 22;
          glass.style.setProperty('--hal-x', `${((dx / distance) * reach).toFixed(2)}px`);
          glass.style.setProperty('--hal-y', `${((dy / distance) * reach).toFixed(2)}px`);
        });
      },
      { ...on, passive: true },
    );
    document.documentElement.addEventListener('pointerleave', resetEye, on);
    finePointer.addEventListener('change', resetEye, on);
  }
  const offSound = ctx.sound.onChange((muted) => {
    if (muted) hum = null;
    else if (conversation.kind === 'waiting')
      hum = lensHum(ctx.sound, conversation.controller.signal);
  });
  syncAvailability();
  render();
  const dispose = () => {
    if (disposed) return;
    close(false);
    disposed = true;
    lifetime.abort();
    observer.disconnect();
    resetEye();
    offSound();
    voice.dispose();
    first.inert = true;
    log.replaceChildren();
    input.value = '';
    ctx.signal.removeEventListener('abort', dispose);
  };
  ctx.signal.addEventListener('abort', dispose, { once: true });
  if (ctx.signal.aborted) dispose();
  return dispose;
}
