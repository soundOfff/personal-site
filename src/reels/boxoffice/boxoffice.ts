import { currentReel, hasChosen, onReelChange, restartAtTop, sound, switchReel } from '../engine';
import { DEFAULT_REEL, reelById } from '../registry';

type Session = { first: boolean; opener: HTMLElement | null };
type State =
  | { kind: 'closed' }
  | { kind: 'browsing'; session: Session }
  | { kind: 'choosing'; session: Session | null };

export function bootBoxOffice(): void {
  const dialog = document.querySelector<HTMLDialogElement>('dialog[data-boxoffice]');
  if (dialog && !dialog.hasAttribute('data-wired')) {
    dialog.setAttribute('data-wired', '');
    wire(dialog);
  }
}

function wire(dialog: HTMLDialogElement): void {
  const root = document.documentElement;
  const films = [...dialog.querySelectorAll<HTMLButtonElement>('[data-bo-ticket]')];
  const house = dialog.querySelector<HTMLAnchorElement>('[data-bo-house]');
  const close = dialog.querySelector<HTMLButtonElement>('[data-bo-close]');
  const closeLabel = dialog.querySelector<HTMLElement>('[data-bo-close-label]');
  const status = dialog.querySelector<HTMLElement>('[data-bo-status]');
  let state: State = { kind: 'closed' };
  let modal = false;
  let background: { element: HTMLElement; inert: boolean }[] = [];

  function syncCurrent(): void {
    const current = hasChosen() ? currentReel().id : null;
    for (const film of films) {
      const selected = film.dataset.boTicket === current;
      film.toggleAttribute('data-current', selected);
      if (selected) film.setAttribute('aria-current', 'true');
      else film.removeAttribute('aria-current');
    }
    house?.toggleAttribute('data-current', current === DEFAULT_REEL);
    if (current === DEFAULT_REEL) house?.setAttribute('aria-current', 'true');
    else house?.removeAttribute('aria-current');
  }

  function setBusy(busy: boolean): void {
    dialog.setAttribute('aria-busy', String(busy));
    for (const film of films) film.setAttribute('aria-disabled', String(busy));
    house?.setAttribute('aria-disabled', String(busy));
  }

  function isolateBackground(): void {
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling instanceof HTMLElement && sibling !== branch) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
  }

  function hide(opener: HTMLElement | null): void {
    delete root.dataset.firstVisit;
    delete root.dataset.boxoffice;
    for (const item of background) item.element.inert = item.inert;
    background = [];
    if (dialog.open) dialog.close();
    dialog.removeAttribute('open');
    dialog.removeAttribute('aria-modal');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  function focusPortfolio(): void {
    const heading =
      [...document.querySelectorAll<HTMLElement>('#readme :is(h1, h2)')].find(
        (element) => element.getClientRects().length > 0,
      ) ?? document.querySelector<HTMLElement>('#readme');
    if (!heading) return;
    const previous = heading.getAttribute('tabindex');
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    heading.addEventListener(
      'blur',
      () => {
        if (previous === null) heading.removeAttribute('tabindex');
        else heading.setAttribute('tabindex', previous);
      },
      { once: true },
    );
  }

  function open(session: Session): void {
    if (
      state.kind !== 'closed' ||
      document.querySelector('[data-projector]')?.getAttribute('data-state')
    )
      return;
    state = { kind: 'browsing', session };
    setBusy(false);
    if (status) status.textContent = '';
    syncCurrent();
    if (closeLabel) closeLabel.textContent = session.first ? 'Skip' : 'Close';
    close?.setAttribute(
      'aria-label',
      session.first ? 'Choose House lights' : 'Close film collection',
    );
    root.dataset.boxoffice = '';
    dialog.scrollTop = 0;
    try {
      dialog.showModal();
      modal = true;
    } catch {
      dialog.setAttribute('open', '');
      dialog.setAttribute('aria-modal', 'true');
      modal = false;
      isolateBackground();
    }
    const current = [...films, house].find((element) => element?.hasAttribute('data-current'));
    (session.first ? dialog : (current ?? films[0] ?? dialog)).focus({
      preventScroll: session.first,
    });
  }

  async function choose(id: string): Promise<void> {
    if (state.kind !== 'browsing') return;
    const reel = reelById(id);
    if (!reel) return;
    const session = state.session;
    state = { kind: 'choosing', session };
    setBusy(true);
    if (status) status.textContent = `Opening ${reel.title}…`;
    sound.click();
    try {
      if (hasChosen() && currentReel().id === reel.id) restartAtTop();
      else await switchReel(reel.id, { instant: true });
    } catch {
      const visibleSession = state.session;
      state = visibleSession ? { kind: 'browsing', session: visibleSession } : { kind: 'closed' };
      setBusy(false);
      if (visibleSession && status)
        status.textContent = 'This film could not open. Try again or choose House lights.';
      return;
    }
    const visibleSession = state.session;
    state = { kind: 'closed' };
    setBusy(false);
    if (visibleSession) {
      hide(null);
      focusPortfolio();
    }
  }

  function dismiss(): void {
    switch (state.kind) {
      case 'closed':
        return;
      case 'browsing':
        if (state.session.first) {
          void choose(DEFAULT_REEL);
        } else {
          const { opener } = state.session;
          state = { kind: 'closed' };
          hide(opener);
        }
        return;
      case 'choosing': {
        const opener = state.session?.opener ?? null;
        state = { kind: 'choosing', session: null };
        hide(opener);
        return;
      }
      default: {
        const exhaustive: never = state;
        return exhaustive;
      }
    }
  }

  for (const film of films) {
    film.addEventListener('click', () => {
      const id = film.dataset.boTicket;
      if (id) void choose(id);
    });
  }
  house?.addEventListener('click', (event) => {
    event.preventDefault();
    void choose(DEFAULT_REEL);
  });
  close?.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) dismiss();
  });
  document.addEventListener('keydown', (event) => {
    if (modal || !dialog.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    } else if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll<HTMLElement>('button, a[href]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  document.querySelectorAll<HTMLElement>('[data-boxoffice-open]').forEach((opener) => {
    opener.addEventListener('click', () => open({ first: false, opener }));
  });
  onReelChange(syncCurrent);
  if (root.hasAttribute('data-first-visit')) {
    if (hasChosen()) delete root.dataset.firstVisit;
    else open({ first: true, opener: null });
  }
}
