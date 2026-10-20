export function mountOpeningDisclosure(scene: Element | null, signal: AbortSignal): () => void {
  const disclosure = scene?.querySelector<HTMLDetailsElement>('details[data-opening-disclosure]');
  const summary = disclosure?.querySelector('summary');
  if (!disclosure || !summary) return () => {};

  const cleanup = () => {
    disclosure.open = false;
    disclosure.removeEventListener('keydown', onKeydown);
    signal.removeEventListener('abort', cleanup);
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !disclosure.open) return;
    event.preventDefault();
    event.stopPropagation();
    disclosure.open = false;
    summary.focus();
  };

  if (signal.aborted) {
    cleanup();
    return cleanup;
  }
  disclosure.addEventListener('keydown', onKeydown, { signal });
  signal.addEventListener('abort', cleanup, { once: true });
  return cleanup;
}
