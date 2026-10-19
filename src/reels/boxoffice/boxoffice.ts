/**
 * The box office's behaviour. Imported from the homepage after the engine boots.
 *
 * The markup is server-rendered (BoxOffice.astro) and, on a first visit, is
 * already on screen from the head bootstrap's html[data-first-visit]. This
 * upgrades it to a modal and runs the screening:
 *
 *   tear a ticket → lights down → leader 3 → 2 (the 2-pop) → black
 *   → hand over to the engine's projector (title card, then it opens).
 *
 * Esc / the close button: on a first visit it means House lights (and is
 * remembered); reopened from the rail it just closes. During the countdown
 * Esc skips straight to the projector.
 */

import { REELS, currentReel, hasChosen, onReelChange, sound, switchReel } from '../engine';

type Phase = 'pick' | 'tear' | 'dim' | 'count' | 'black';

/** ms from the tear. The board's timing: stub falls, lights down, 3, 2, black. */
const CUE = { dim: 560, three: 1300, two: 2300, flashOff: 2345, black: 3300, handover: 3480 };
const LEAVE_MS = 460;
const HOUSE = REELS[0].id;

/* ---------- the sounds: paper, the leader, the 2-pop (all no-ops while muted) ---------- */

const sfx = {
  /** a fingernail across the ticket edge */
  flick(): void {
    sound.burst({ dur: 0.022, f: 3200, q: 1.2, vol: 0.07 });
  },
  /** perforated card stock giving way: a ragged run of tiny bursts */
  tear(): void {
    for (let i = 0; i < 11; i++) {
      sound.burst({
        dur: 0.016 + Math.random() * 0.022,
        f: 1800 + Math.random() * 2800,
        q: 1.4,
        vol: 0.1 + Math.random() * 0.14,
        at: i * 0.026 + Math.random() * 0.012,
      });
    }
    sound.tone({ f0: 240, f1: 120, dur: 0.05, vol: 0.06, at: 0.28 });
  },
  /** the auditorium dims: a falling hum under a closing low-pass */
  lightsDown(): void {
    sound.tone({ f0: 110, f1: 55, dur: 0.9, vol: 0.08 });
    const ac = sound.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const n = sound.noise(0.9);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.9);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    n.connect(lp);
    lp.connect(g);
    g.connect(sound.out());
    n.start(t);
  },
  /** a splice clicking through the gate */
  leaderTick(at = 0): void {
    sound.burst({ dur: 0.01, kind: 'highpass', f: 3000, vol: 0.22, at });
  },
  /** the 2-pop: one frame (1/24 s) of a flat 1 kHz tone */
  twoPop(): void {
    const ac = sound.ctx();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    osc.frequency.value = 1000;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.002);
    g.gain.setValueAtTime(0.2, t + 0.04);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.044);
    osc.connect(g);
    g.connect(sound.out());
    osc.start(t);
    osc.stop(t + 0.06);
  },
};

/* ---------- the box office ---------- */

export function bootBoxOffice(): void {
  const dlg = document.querySelector<HTMLDialogElement>('dialog[data-boxoffice]');
  if (dlg) wire(dlg);
}

function wire(dlg: HTMLDialogElement): void {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tickets = [...dlg.querySelectorAll<HTMLButtonElement>('[data-bo-ticket]')];
  const house = dlg.querySelector<HTMLAnchorElement>('[data-bo-house]');
  const closeBtn = dlg.querySelector<HTMLButtonElement>('[data-bo-close]');
  const closeLabel = dlg.querySelector<HTMLElement>('[data-bo-close-label]');
  const num = dlg.querySelector<HTMLElement>('[data-bo-num]');
  const clock = dlg.querySelector<HTMLElement>('[data-bo-clock]');

  let state: 'open' | 'closed' = 'closed';
  let modal = false;
  let first = false;
  let picked: string | null = null;
  let timers: number[] = [];
  let clockTimer = 0;

  const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const phase = () => (dlg.dataset.phase ?? 'pick') as Phase;
  const setPhase = (p: Phase) => (dlg.dataset.phase = p);
  const projectorBusy = () =>
    !!document.querySelector<HTMLElement>('[data-projector]')?.dataset.state;

  /* -- the lobby clock, Rosario time: the minute is all a visitor needs -- */
  let fmt: Intl.DateTimeFormat | null = null;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Argentina/Cordoba',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    /* no Intl time zones: the clock stays blank */
  }
  const tickClock = () => {
    if (clock && fmt) clock.textContent = fmt.format(new Date());
  };

  /* -- which ticket is already screening (reopened from the rail) -- */
  const syncCurrent = () => {
    const now = hasChosen() ? currentReel().id : null;
    for (const t of tickets) {
      const on = t.dataset.boTicket === now;
      t.toggleAttribute('data-current', on);
      t.setAttribute(
        'aria-label',
        `${t.dataset.label}. ${on ? 'Screening now. Back to your seat' : 'Tear the ticket to start the screening'}`,
      );
    }
    house?.toggleAttribute('data-current', now === HOUSE);
  };
  onReelChange(syncCurrent);

  /* -- open / close -- */

  function open(isFirst: boolean): void {
    if (state === 'open' || projectorBusy()) return;
    state = 'open';
    first = isFirst;
    reset();
    dlg.dataset.mode = isFirst ? 'first' : 'again';
    syncCurrent();
    if (closeBtn && closeLabel) {
      closeLabel.textContent = isFirst ? 'skip' : 'close';
      closeBtn.setAttribute(
        'aria-label',
        isFirst ? 'Skip the films: House lights, no film' : 'Close the box office',
      );
    }
    root.dataset.boxoffice = '';
    try {
      dlg.showModal();
      modal = true;
    } catch {
      dlg.setAttribute('open', '');
      modal = false;
    }
    // First visit: the lobby itself takes focus (no ticket lifts on load).
    // Reopened: whatever is screening now, so Enter takes you back to it.
    const current = [...tickets, house].find((el) => el?.hasAttribute('data-current'));
    const target = isFirst ? dlg : (current ?? tickets[0] ?? dlg);
    target.focus({ preventScroll: true });
    tickClock();
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(tickClock, 30_000);
    if (!isFirst) sound.whoosh();
  }

  /** Put the lobby back the way it opens: untorn tickets, lights up. */
  function reset(): void {
    clearTimers();
    picked = null;
    setPhase('pick');
    delete dlg.dataset.flash;
    delete dlg.dataset.leaving;
    tickets.forEach((t) => t.removeAttribute('data-torn'));
    if (num) num.textContent = '3';
  }

  /** The visitor has chosen (or dismissed): drop the first-visit cover, then go. */
  function finish(fade: boolean): void {
    delete root.dataset.firstVisit;
    delete root.dataset.boxoffice;
    window.clearInterval(clockTimer);
    if (fade && !reduced.matches) {
      dlg.dataset.leaving = '';
      later(LEAVE_MS, shut);
    } else {
      shut();
    }
  }

  function shut(): void {
    state = 'closed';
    if (dlg.open) dlg.close();
    dlg.removeAttribute('open');
    reset();
  }

  /* -- choices -- */

  function chooseHouse(): void {
    if (state !== 'open' || phase() !== 'pick' || dlg.dataset.leaving !== undefined) return;
    sound.click();
    if (!hasChosen() || currentReel().id !== HOUSE) void switchReel(HOUSE, { instant: true });
    finish(true);
  }

  function tear(ticket: HTMLButtonElement): void {
    const id = ticket.dataset.boTicket;
    if (!id || state !== 'open' || phase() !== 'pick' || dlg.dataset.leaving !== undefined) return;

    // Already screening this one: just back to your seat.
    if (hasChosen() && currentReel().id === id) {
      sound.click();
      finish(true);
      return;
    }

    picked = id;
    ticket.setAttribute('data-torn', '');
    sfx.tear();

    if (reduced.matches) {
      // No tear, no countdown: straight to the film.
      void switchReel(id);
      finish(false);
      return;
    }

    setPhase('tear');
    later(CUE.dim, () => {
      setPhase('dim');
      sfx.lightsDown();
    });
    later(CUE.three, () => {
      if (num) num.textContent = '3';
      setPhase('count');
      sound.projector((CUE.black - CUE.three + 400) / 1000);
      sfx.leaderTick();
      sfx.leaderTick(0.5);
    });
    later(CUE.two, () => {
      if (num) num.textContent = '2';
      dlg.dataset.flash = '';
      sfx.twoPop();
    });
    later(CUE.flashOff, () => delete dlg.dataset.flash);
    later(CUE.black, () => setPhase('black'));
    later(CUE.handover, () => handover(id));
  }

  /** Black on black: the engine's projector takes the screen, then the lobby goes. */
  function handover(id: string): void {
    clearTimers();
    void switchReel(id, { fromBlack: true });
    // switchReel closes the projector synchronously; if it declined (a switch
    // already running, the same reel), fade the lobby out instead.
    const pj = document.querySelector<HTMLElement>('[data-projector]');
    finish(pj?.dataset.state !== 'close');
  }

  /** Esc, the close button, or the platform closing the dialog on its own. */
  function dismiss(): void {
    if (state !== 'open' || dlg.dataset.leaving !== undefined) return;
    if (picked && phase() !== 'pick') handover(picked);
    else if (first) chooseHouse();
    else {
      sound.drop();
      finish(true);
    }
  }

  /* -- wiring -- */

  tickets.forEach((t) => {
    t.addEventListener('click', () => tear(t));
    t.addEventListener('pointerenter', () => {
      if (phase() === 'pick') sfx.flick();
    });
  });
  house?.addEventListener('click', (e) => {
    e.preventDefault();
    chooseHouse();
  });
  house?.addEventListener('pointerenter', () => sound.tick());
  closeBtn?.addEventListener('click', dismiss);

  dlg.addEventListener('cancel', (e) => {
    // Without a recent activation the browser may not let us cancel: then it
    // closes the dialog itself and the 'close' handler below catches up.
    if (!e.cancelable) return;
    e.preventDefault();
    dismiss();
  });
  dlg.addEventListener('close', () => {
    if (state === 'open') dismiss();
  });
  // The fallback when showModal is unavailable (no top layer, no 'cancel').
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'open' && !modal) dismiss();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-boxoffice-open]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.click();
      open(false);
    }),
  );

  /* -- the first visit -- */
  if (root.hasAttribute('data-first-visit')) {
    if (hasChosen()) delete root.dataset.firstVisit;
    else open(true);
  }
}
