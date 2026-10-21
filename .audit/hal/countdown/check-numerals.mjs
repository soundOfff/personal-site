import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const base = process.argv[2];
if (!base) throw new Error('Pass the source checkout path.');
const soundPath = path.join(base, 'src/reels/sound.ts');
const boxPath = path.join(base, 'src/reels/boxoffice/boxoffice.ts');
const soundSource = fs.readFileSync(soundPath, 'utf8')
  .replace("import { SOUND_KEY } from './registry';", "const SOUND_KEY = 'countdown-audit';")
  .replace(/export /g, '');
const box = fs.readFileSync(boxPath, 'utf8');
const sfx = box.slice(box.indexOf('const sfx = {'), box.indexOf('/* ---------- the box office ---------- */'));
const cue = box.match(/const CUE = \{[\s\S]*?\n\};/)?.[0];
const sequence = box.slice(box.indexOf('    later(CUE.three,'), box.indexOf("    later(CUE.black,"));
if (!cue || !sequence) throw new Error('Countdown source not found.');
const compiled = ts.transpile(soundSource + '\n' + sfx + '\n' + cue,
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
const script = `${compiled}
(async () => {
  const offline = new OfflineAudioContext(1, 48000 * 5, 48000);
  let now = 0;
  const oscillators = [];
  const ac = new Proxy(offline, { get(target, name) {
    if (name === 'currentTime') return now;
    if (name === 'state') return 'running';
    if (name === 'createOscillator') return () => {
      const oscillator = target.createOscillator();
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (at) => {
        oscillators.push({ at, frequency: oscillator.frequency.value });
        start(at);
      };
      return oscillator;
    };
    const value = Reflect.get(target, name, target);
    return typeof value === 'function' ? value.bind(target) : value;
  }});
  sound.ac = ac;
  sound._muted = false;
  sound.gestured = true;
  const scheduled = [];
  const num = { textContent: '' };
  const setPhase = () => {};
  const later = (delay, callback) => scheduled.push({ delay, callback });
  ${sequence}
  const numerals = [];
  for (const {delay, callback} of scheduled) {
    now = (delay - CUE.three) / 1000;
    callback();
    numerals.push({ numeral: num.textContent, at: now });
  }
  const buffer = await offline.startRendering();
  const samples = buffer.getChannelData(0);
  const tones = oscillators.filter(tone => tone.frequency === 1000);
  const levels = numerals.map(({numeral,at}) => {
    const window = samples.slice(at * 48000, (at + .1) * 48000);
    const rms = Math.sqrt(window.reduce((sum,sample) => sum+sample*sample,0)/window.length);
    return {numeral,at,rms};
  });
  const pass = tones.length === 4 && tones.every((tone,i) => tone.at === i) && levels.every(level => level.rms > .03);
  document.querySelector('pre').textContent = JSON.stringify({pass,numerals,tones,levels,sources:${JSON.stringify([soundPath, boxPath])}},null,2);
  document.title = pass ? 'PASS - Four countdown bips' : 'FAIL - Missing countdown bips';
})().catch(error => { document.querySelector('pre').textContent = error.stack; document.title='ERROR'; });`;
fs.writeFileSync(new URL('./numerals.html', import.meta.url),
  '<!doctype html><title>Rendering countdown</title><h1>Countdown numeral bips</h1><pre>Rendering…</pre><script>' + script + '</script>');
