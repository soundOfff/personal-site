/**
 * The reel engine: the client half of the film-palette homepage.
 *
 * It owns the things every reel shares, so a reel's own code is only its film:
 *   - which reel is screening (`html[data-reel]`, persisted) and which act is
 *     in view (`html[data-act]`, `html[data-sec]`),
 *   - the projector: cue marks → letterbox closes → title card → opens,
 *   - loading a reel's client module on demand and unmounting it cleanly,
 *   - the switcher in the rail, the sound toggle, the aria-live announcement,
 *   - relaying playground cues (`reel:cue` events) to the reel.
 *
 * Imported once from the homepage; other scripts (the box office) import the
 * same module and get the same instance.
 */

import { REELS, REEL_KEY, DEFAULT_REEL, actOf, reelById } from './registry';
import { sound } from './sound';
import { REEL_CSS } from './stylesheets';
import type { Cue, ReelConfig, ReelContext, ReelModule } from './types';

const loaders = import.meta.glob<{ default: ReelModule }>('./*/client.ts');
const loaderFor = (id: string) => loaders[`./${id}/client.ts`];
const cssLoads = new Map<string, Promise<void>>();

type ReelListener = (reel: ReelConfig) => void;

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let sectionIndex = 0;
let mounted: { id: string; abort: AbortController; cleanup?: () => void } | null = null;
let switching = false;
const sectionListeners = new Set<(i: number, prev: number) => void>();
const cueListeners = new Set<(cue: Cue) => void>();
const reelListeners = new Set<ReelListener>();

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function currentReel(): ReelConfig {
  return reelById(root.dataset.reel) ?? reelById(DEFAULT_REEL)!;
}

/** True once the visitor has picked anything, House lights included. */
export function hasChosen(): boolean {
  try {
    return reelById(localStorage.getItem(REEL_KEY)) !== undefined;
  } catch {
    return true;
  }
}

export function onReelChange(cb: ReelListener): () => void {
  reelListeners.add(cb);
  return () => reelListeners.delete(cb);
}

export { sound };

/* ---------- loading ---------- */

/**
 * Attach a reel's stylesheet (once) and resolve when it has applied. Its
 * rules are scoped to `html[data-reel]`, so it can stay after a switch away.
 * Errors and slow networks resolve too: a reel without its CSS still reads.
 */
export function loadCss(id: string): Promise<void> {
  const href = REEL_CSS[id];
  if (!href) return Promise.resolve();
  let pending = cssLoads.get(id);
  if (pending) return pending;
  if (document.querySelector(`link[data-reel-css='${id}']`)) {
    // written by the head bootstrap, parser-blocking: already applied
    pending = Promise.resolve();
  } else {
    pending = new Promise<void>((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.reelCss = id;
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener(
        'error',
        () => {
          cssLoads.delete(id);
          link.remove();
          resolve();
        },
        { once: true },
      );
      setTimeout(resolve, 5000);
      document.head.appendChild(link);
    });
  }
  cssLoads.set(id, pending);
  return pending;
}

/**
 * Warm the reel's title-card face once its CSS (and so its @font-face) is in,
 * so the card never shows before its glyphs. Bounded: a slow font never
 * holds up the projector for long.
 */
function warmFonts(id: string): Promise<void> {
  const reel = reelById(id);
  const face = reel?.type?.title ?? reel?.type?.display;
  if (!reel || !face || !document.fonts) return Promise.resolve();
  const text = `${reel.native ?? ''}${reel.title}`;
  const load = document.fonts.load(`1em ${face}`, text).then(
    () => undefined,
    () => undefined,
  );
  return Promise.race([load, wait(900)]);
}

/** Everything a switch needs before the reel can apply. */
function prepare(id: string): Promise<ReelModule | null> {
  return Promise.all([loadModule(id), loadCss(id).then(() => warmFonts(id))]).then(([mod]) => mod);
}

/** Fetch a reel's module, stylesheet and title face ahead of a likely switch (hover, focus). */
export function prefetch(id: string): void {
  void prepare(id);
}

/* ---------- mounting ---------- */

async function loadModule(id: string): Promise<ReelModule | null> {
  const load = loaderFor(id);
  if (!load) return null;
  try {
    return (await load()).default;
  } catch (err) {
    console.error(`[reels] failed to load ${id}`, err);
    return null;
  }
}

function contextFor(reel: ReelConfig, signal: AbortSignal): ReelContext {
  return {
    reel,
    root,
    sound,
    reducedMotion: reducedMotion.matches,
    signal,
    section: () => sectionIndex,
    onSection(cb) {
      sectionListeners.add(cb);
      const off = () => sectionListeners.delete(cb);
      signal.addEventListener('abort', off, { once: true });
      return off;
    },
    onCue(cb) {
      cueListeners.add(cb);
      const off = () => cueListeners.delete(cb);
      signal.addEventListener('abort', off, { once: true });
      return off;
    },
  };
}

function unmount(): void {
  if (!mounted) return;
  const m = mounted;
  mounted = null;
  try {
    m.cleanup?.();
  } catch (err) {
    console.error(`[reels] ${m.id} cleanup failed`, err);
  }
  m.abort.abort();
}

async function mount(reel: ReelConfig, mod?: ReelModule | null): Promise<ReelContext | null> {
  unmount();
  const abort = new AbortController();
  mounted = { id: reel.id, abort };
  const ctx = contextFor(reel, abort.signal);
  const module = mod === undefined ? await loadModule(reel.id) : mod;
  // A later switch may have replaced us while the chunk loaded.
  if (!module || mounted?.abort !== abort) return ctx;
  try {
    const cleanup = module.mount(ctx);
    if (cleanup) mounted.cleanup = cleanup;
  } catch (err) {
    console.error(`[reels] ${reel.id} mount failed`, err);
  }
  return ctx;
}

/* ---------- applying a reel ---------- */

function apply(reel: ReelConfig): void {
  root.dataset.reel = reel.id;
  root.dataset.act = String(actOf(reel, sectionIndex));
  try {
    localStorage.setItem(REEL_KEY, reel.id);
  } catch {
    /* ignore */
  }
  reelListeners.forEach((l) => l(reel));
}

function announce(text: string): void {
  const live = document.querySelector<HTMLElement>('[data-reel-live]');
  if (!live) return;
  live.textContent = '';
  // A fresh text node after a frame makes screen readers re-announce.
  requestAnimationFrame(() => (live.textContent = text));
}

export interface SwitchOptions {
  /** skip the cue marks + closing (the box office plays its own countdown) */
  fromBlack?: boolean;
  /** no projector at all */
  instant?: boolean;
}

/**
 * Screen the page through `id`. Resolves when the projector has opened on
 * the new reel. Calls made mid-switch are ignored.
 */
export async function switchReel(id: string, opts: SwitchOptions = {}): Promise<void> {
  const next = reelById(id);
  if (!next || switching) return;
  if (next.id === currentReel().id && mounted?.id === next.id) return;

  const projector = document.querySelector<HTMLElement>('[data-projector]');
  // Module, stylesheet and title face load while the projector runs; all land before the reel applies.
  const preload = prepare(next.id);

  if (opts.instant || reducedMotion.matches || !projector) {
    apply(next);
    await mount(next, await preload);
    announce(next.announce);
    return;
  }

  switching = true;
  try {
    projector.dataset.title = next.id;
    // The bars close to the film's own frame, the first ratio it lists (for
    // Budapest, the 1.37 of its 1932 story). House lights has none: it only dims.
    const ratio = parseFloat(next.ratio ?? '');
    if (ratio > 0) projector.style.setProperty('--pj-ratio', String(ratio));
    projector.toggleAttribute('data-frameless', !(ratio > 0));
    if (!opts.fromBlack) {
      projector.dataset.state = 'cue';
      sound.cueTicks();
      await wait(300);
      projector.dataset.state = 'close';
      sound.projector(1.9);
      await wait(460);
    } else {
      projector.dataset.state = 'close';
      projector.classList.add('is-instant');
      await wait(30);
      projector.classList.remove('is-instant');
    }

    projector.dataset.state = 'card';
    const mod = await preload;
    apply(next);
    const ctx = await mount(next, mod);
    if (mod?.titleSound && ctx) mod.titleSound(ctx);
    else sound.chime();
    announce(next.announce);

    await wait(990);
    projector.dataset.state = 'open';
    await wait(500);
  } finally {
    projector.dataset.state = '';
    switching = false;
  }
}

/* ---------- sections and acts ---------- */

function setSection(i: number): void {
  if (i === sectionIndex) return;
  const prev = sectionIndex;
  sectionIndex = i;
  root.dataset.sec = String(i);
  root.dataset.act = String(actOf(currentReel(), i));
  sectionListeners.forEach((l) => l(i, prev));
}

/**
 * The section in view is the last one whose top has passed a line 40% down
 * the viewport, so interludes between sections keep the one above, and any
 * jump (a reload mid-page, an anchor, the End key) lands on the right one.
 */
function watchSections(): void {
  const secs = [...document.querySelectorAll<HTMLElement>('section[data-sec]')];
  if (!secs.length) return;
  let ticking = false;
  const probe = () => {
    ticking = false;
    const doc = document.documentElement;
    // At the very bottom the last section wins even when it is short.
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
      setSection(secs.length - 1);
      return;
    }
    const line = window.innerHeight * 0.4;
    let current = 0;
    secs.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= line) current = i;
    });
    setSection(current);
  };
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(probe);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  schedule();
}

/* ---------- the switcher and the sound toggle ---------- */

function wireSwitcher(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-reel-pick]')];
  const title = document.querySelector<HTMLElement>('[data-reel-title]');
  const meta = document.querySelector<HTMLElement>('[data-reel-meta]');
  const no = document.querySelector<HTMLElement>('[data-reel-no]');

  const label = (reel: ReelConfig) => {
    if (title) title.textContent = reel.title;
    if (meta) meta.textContent = reel.meta;
  };
  const sync = (reel: ReelConfig) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.reelPick === reel.id)));
    if (no) no.textContent = reel.n;
    label(reel);
  };

  buttons.forEach((b) => {
    const reel = reelById(b.dataset.reelPick);
    if (!reel) return;
    b.addEventListener('click', () => {
      sound.click();
      void switchReel(reel.id);
    });
    b.addEventListener('pointerenter', () => {
      label(reel);
      sound.tick();
      prefetch(reel.id);
    });
    b.addEventListener('focus', () => {
      label(reel);
      prefetch(reel.id);
    });
    b.addEventListener('pointerleave', () => label(currentReel()));
    b.addEventListener('blur', () => label(currentReel()));
  });

  sync(currentReel());
  onReelChange(sync);
}

function wireSoundToggles(): void {
  const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]')];
  const sync = (muted: boolean) =>
    toggles.forEach((t) => {
      t.setAttribute('aria-pressed', String(!muted));
      const lbl = t.querySelector('[data-sound-label]');
      if (lbl) lbl.textContent = muted ? 'sound off' : 'sound on';
    });
  toggles.forEach((t) => t.addEventListener('click', () => sound.setMuted(!sound.muted)));
  sync(sound.muted);
  sound.onChange(sync);
}

/* ---------- boot ---------- */

let booted = false;

export function boot(): void {
  if (booted) return;
  booted = true;

  // The inline bootstrap already set data-reel before paint; trust but verify.
  const reel = currentReel();
  root.dataset.reel = reel.id;
  root.dataset.sec = '0';
  root.dataset.act = String(actOf(reel, 0));

  watchSections();
  wireSwitcher();
  wireSoundToggles();

  document.addEventListener('reel:cue', (e) => {
    const cue = (e as CustomEvent<Cue>).detail;
    if (cue) cueListeners.forEach((l) => l(cue));
  });

  if (reel.id !== DEFAULT_REEL) {
    void loadCss(reel.id); // no-op when the bootstrap already wrote its <link>
    void mount(reel);
  }
}

/** For the box office and tests: every reel, in switcher order. */
export { REELS };
