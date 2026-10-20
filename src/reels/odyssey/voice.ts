import type { SoundKit } from '../sound';

type VoiceState =
  | { kind: 'idle' }
  | { kind: 'queued' | 'speaking'; utterance: SpeechSynthesisUtterance; timeout: number }
  | { kind: 'unavailable'; reason: 'unsupported' | 'engine' };

function languageFor(text: string): 'en' | 'es' {
  return /[¿¡]|\b(hola|pel[ií]cula|cine|qu[eé]|alguna|gustar[ií]a|recuerdas|tienes|cu[aá]l|una|pero|para)\b/i.test(
    text,
  )
    ? 'es'
    : 'en';
}

function chooseVoice(engine: SpeechSynthesis, language: 'en' | 'es') {
  const voices = engine
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language));
  const preference =
    language === 'en'
      ? ['Daniel', 'Alex', 'Google UK English Male', 'Ryan', 'George', 'David']
      : ['Jorge', 'Diego', 'Pablo', 'Juan', 'Carlos'];
  for (const name of preference) {
    const voice = voices.find((candidate) =>
      candidate.name.toLowerCase().includes(name.toLowerCase()),
    );
    if (voice) return voice;
  }
  return voices.find((voice) => voice.default) ?? voices[0];
}

export function mountVoice(args: {
  sound: SoundKit;
  button: HTMLButtonElement;
  status: HTMLElement;
  indicator: HTMLElement;
  latestText: () => string;
}) {
  const engine = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let state: VoiceState =
    engine && 'SpeechSynthesisUtterance' in window
      ? { kind: 'idle' }
      : { kind: 'unavailable', reason: 'unsupported' };

  const render = () => {
    args.indicator.toggleAttribute('data-hal-speaking', state.kind === 'speaking');
    args.button.disabled = state.kind === 'unavailable' && state.reason === 'unsupported';
    args.button.textContent =
      state.kind === 'speaking' || state.kind === 'queued'
        ? 'Stop voice'
        : args.sound.muted
          ? 'Sound on · Hear HAL'
          : 'Hear HAL';
    args.status.textContent =
      state.kind === 'unavailable'
        ? 'Synthetic voice unavailable. HAL’s text is still available.'
        : state.kind === 'speaking'
          ? 'Synthetic voice · speaking'
          : state.kind === 'queued'
            ? 'Synthetic voice · preparing'
            : args.sound.muted
              ? 'Synthetic voice · sound is off'
              : 'Synthetic voice · your device’s speech engine';
  };
  const stop = () => {
    if (state.kind !== 'speaking' && state.kind !== 'queued') return;
    const previous = state;
    state = { kind: 'idle' };
    window.clearTimeout(previous.timeout);
    engine?.cancel();
    render();
  };
  const speak = (text: string) => {
    if (
      !engine ||
      args.sound.muted ||
      (state.kind === 'unavailable' && state.reason === 'unsupported')
    )
      return;
    stop();
    const utterance = new SpeechSynthesisUtterance(text);
    const language = languageFor(text);
    const voice = chooseVoice(engine, language);
    utterance.lang = voice?.lang ?? (language === 'es' ? 'es-AR' : 'en-US');
    if (voice) utterance.voice = voice;
    utterance.rate = 0.85;
    utterance.pitch = 0.75;
    utterance.volume = 0.8;
    const settle = (failed: boolean) => {
      if ((state.kind !== 'speaking' && state.kind !== 'queued') || state.utterance !== utterance)
        return;
      window.clearTimeout(state.timeout);
      state = failed ? { kind: 'unavailable', reason: 'engine' } : { kind: 'idle' };
      if (failed) engine.cancel();
      render();
    };
    utterance.onstart = () => {
      if (state.kind !== 'queued' || state.utterance !== utterance) return;
      state = { ...state, kind: 'speaking' };
      render();
    };
    utterance.onend = () => settle(false);
    utterance.onerror = () => settle(true);
    state = {
      kind: 'queued',
      utterance,
      timeout: window.setTimeout(() => settle(true), Math.max(30_000, text.length * 180)),
    };
    render();
    try {
      engine.speak(utterance);
    } catch {
      settle(true);
    }
  };
  const onClick = () => {
    if (state.kind === 'speaking' || state.kind === 'queued') stop();
    else {
      if (args.sound.muted) args.sound.setMuted(false);
      speak(args.latestText());
    }
  };
  args.button.addEventListener('click', onClick);
  const offSound = args.sound.onChange((muted) => {
    if (muted) stop();
    render();
  });
  render();
  return {
    speak,
    stop,
    dispose() {
      stop();
      offSound();
      args.button.removeEventListener('click', onClick);
    },
  };
}
