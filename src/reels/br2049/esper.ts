import type { ReelContext } from '../types';

type EvidenceView = 'architecture' | 'tradeoff';
type EsperCase = {
  title: string;
  link: HTMLAnchorElement;
  row: HTMLTableRowElement;
  inspect: HTMLButtonElement;
  evidence: Record<EvidenceView, HTMLParagraphElement>;
};
type EsperState =
  | { kind: 'closed' }
  | {
      kind: 'selected';
      entry: EsperCase;
      drawer: HTMLTableRowElement;
      events: AbortController;
    };

function excerpt(template: HTMLTemplateElement, heading: string): HTMLParagraphElement | null {
  const section = [...template.content.querySelectorAll('h2')].find(
    (element) => element.textContent?.trim().toLowerCase() === heading,
  );
  let next = section?.nextElementSibling;
  while (next && !next.matches('h1, h2')) {
    if (next instanceof HTMLParagraphElement && next.textContent?.trim()) return next;
    next = next.nextElementSibling;
  }
  return null;
}

export function mountEsper(ctx: ReelContext): () => void {
  const work = document.getElementById('work');
  if (!work || ctx.signal.aborted) return () => {};
  const listeners = new AbortController();
  const entries: EsperCase[] = [];
  let state: EsperState = { kind: 'closed' };
  let animations: Animation[] = [];

  const cancelMotion = () => {
    animations.forEach((animation) => animation.cancel());
    animations = [];
  };
  const close = (restoreFocus: boolean) => {
    if (state.kind === 'closed') return;
    const { entry, drawer, events } = state;
    cancelMotion();
    events.abort();
    state = { kind: 'closed' };
    entry.inspect.setAttribute('aria-expanded', 'false');
    if (restoreFocus) entry.inspect.focus({ preventScroll: true });
    drawer.remove();
  };

  const open = (entry: EsperCase) => {
    close(false);
    const events = new AbortController();
    const drawer = document.createElement('tr');
    drawer.className = 'br-esper-row';
    const cell = document.createElement('td');
    cell.colSpan = 4;
    const panel = document.createElement('section');
    panel.className = 'br-esper';
    panel.id = entry.inspect.getAttribute('aria-controls') ?? '';
    panel.setAttribute('aria-label', `Inspect ${entry.title}`);

    const viewfinder = document.createElement('div');
    viewfinder.className = 'br-esper-viewfinder';
    viewfinder.setAttribute('aria-hidden', 'true');
    viewfinder.innerHTML =
      '<div class="br-esper-photo"></div><div class="br-esper-crop"></div>' +
      '<div class="br-esper-scan"></div><div class="br-esper-frame-label">ESPER / VISUAL PLATE</div>';
    const scan = viewfinder.querySelector<HTMLElement>('.br-esper-scan');
    const copy = document.createElement('div');
    copy.className = 'br-esper-copy';
    const header = document.createElement('div');
    header.className = 'br-esper-header';
    const label = document.createElement('p');
    label.className = 'br-esper-label';
    label.textContent = `ESPER / ${entry.title}`;
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'br-esper-close';
    dismiss.textContent = 'Close ×';
    dismiss.setAttribute('aria-label', `Close inspection of ${entry.title}`);
    dismiss.addEventListener('click', () => close(true), { signal: events.signal });
    header.appendChild(label);
    header.appendChild(dismiss);
    const controls = document.createElement('div');
    controls.className = 'br-esper-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Case evidence');
    const evidence = document.createElement('div');
    evidence.className = 'br-esper-evidence';
    evidence.id = `${panel.id}-evidence`;
    evidence.setAttribute('aria-live', 'polite');
    const heading = document.createElement('h3');
    const paragraph = document.createElement('div');
    evidence.appendChild(heading);
    evidence.appendChild(paragraph);
    const link = document.createElement('a');
    link.className = 'br-esper-source';
    link.href = entry.link.href;
    link.textContent = 'Read the full case study';
    copy.appendChild(header);
    copy.appendChild(controls);
    copy.appendChild(evidence);
    copy.appendChild(link);
    panel.appendChild(viewfinder);
    panel.appendChild(copy);
    cell.appendChild(panel);
    drawer.appendChild(cell);
    entry.row.insertAdjacentElement('afterend', drawer);
    state = { kind: 'selected', entry, drawer, events };
    entry.inspect.setAttribute('aria-expanded', 'true');

    const buttons: { view: EvidenceView; button: HTMLButtonElement }[] = [];
    const select = (view: EvidenceView) => {
      cancelMotion();
      panel.dataset.view = view;
      buttons.forEach(({ view: candidate, button }) =>
        button.setAttribute('aria-pressed', String(candidate === view)),
      );
      heading.textContent = view === 'architecture' ? 'Architecture' : 'The key tradeoff';
      const clone = entry.evidence[view].cloneNode(true);
      if (clone instanceof Element) {
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      }
      paragraph.replaceChildren(clone);
      if (!ctx.reducedMotion && scan) {
        animations.push(
          scan.animate(
            [
              { transform: 'translateY(0)', opacity: 0 },
              { opacity: 0.8, offset: 0.12 },
              { transform: `translateY(${viewfinder.clientHeight}px)`, opacity: 0 },
            ],
            { duration: 780, easing: 'ease-in-out' },
          ),
        );
      }
    };
    for (const view of ['architecture', 'tradeoff'] satisfies EvidenceView[]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = view === 'architecture' ? 'Architecture' : 'Tradeoff';
      button.setAttribute('aria-controls', evidence.id);
      button.addEventListener('click', () => select(view), { signal: events.signal });
      controls.appendChild(button);
      buttons.push({ view, button });
    }
    select('architecture');
    if (!ctx.reducedMotion) {
      animations.push(
        panel.animate(
          [
            { opacity: 0, transform: 'translateY(-8px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 340, easing: 'cubic-bezier(.2,.7,.1,1)' },
        ),
      );
    }
  };

  work.querySelectorAll<HTMLTableRowElement>('.idx tr[data-href]').forEach((row, index) => {
    const project = row.querySelector<HTMLTableCellElement>('.proj');
    const link = project?.querySelector<HTMLAnchorElement>('a[href]');
    const template = project?.querySelector<HTMLTemplateElement>('template[data-esper-case]');
    if (!project || !link || !template) return;
    const architecture = excerpt(template, 'architecture');
    const tradeoff = excerpt(template, 'the key tradeoff');
    if (!architecture || !tradeoff) return;
    const title = link.textContent?.trim() ?? 'case study';
    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.className = 'br-esper-inspect';
    inspect.textContent = 'Inspect';
    inspect.setAttribute('aria-label', `Inspect ${title}`);
    inspect.setAttribute('aria-expanded', 'false');
    inspect.setAttribute('aria-controls', `br-esper-${index}`);
    const entry = { title, link, row, inspect, evidence: { architecture, tradeoff } };
    inspect.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        if (state.kind === 'selected' && state.entry === entry) close(false);
        else open(entry);
      },
      { signal: listeners.signal },
    );
    project.appendChild(inspect);
    entries.push(entry);
  });
  work.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || state.kind === 'closed') return;
      event.preventDefault();
      event.stopPropagation();
      close(true);
    },
    { signal: listeners.signal },
  );
  const cleanup = () => {
    close(false);
    cancelMotion();
    listeners.abort();
    entries.forEach(({ inspect }) => inspect.remove());
    ctx.signal.removeEventListener('abort', cleanup);
  };
  ctx.signal.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
