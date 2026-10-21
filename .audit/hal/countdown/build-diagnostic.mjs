import fs from 'node:fs';
import ts from 'typescript';
const base = '/Users/User/.codex/worktrees/parasite-mood-openings/personal-site';
const soundPath = `${base}/src/reels/sound.ts`;
const boxPath = `${base}/src/reels/boxoffice/boxoffice.ts`;
const soundSource = fs.readFileSync(soundPath, 'utf8').replace("import { SOUND_KEY } from './registry';", "const SOUND_KEY = 'countdown-audit';").replace(/export /g, '');
const boxSource = fs.readFileSync(boxPath, 'utf8');
const sfxSource = boxSource.slice(boxSource.indexOf('const sfx = {'), boxSource.indexOf('/* ---------- the box office ---------- */'));
const compiled = ts.transpile(soundSource + '\n' + sfxSource, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
const script = `${compiled}
(async () => {
 const cases = [];
 for (const kind of ['projector', 'countdown', 'two-pop', 'leader-tick']) {
  const offline = new OfflineAudioContext(1, 48000 * 5, 48000);
  let now = 0;
  const ac = new Proxy(offline, {get(target, name) {
   if (name === 'currentTime') return now;
   if (name === 'state') return 'running';
   const value = Reflect.get(target, name, target);
   return typeof value === 'function' ? value.bind(target) : value;
  }});
  sound.ac = ac;
  sound.limiter = null;
  sound.master = null;
  sound._muted = false;
  sound.gestured = true;
  if (kind === 'projector' || kind === 'countdown') sound.projector(4.4);
  if (kind === 'countdown') {
   sfx.leaderTick();
   sfx.leaderTick(0.5);
   now = 1; sfx.twoPop();
   now = 2; sfx.leaderTick();
   now = 3; sfx.leaderTick();
  }
  if (kind === 'two-pop') sfx.twoPop();
  if (kind === 'leader-tick') sfx.leaderTick();
  const buf = await offline.startRendering();
  const data = buf.getChannelData(0);
  const windows = [[0,0.1],[0.3,0.9],[1,1.1],[1.3,1.9],[2,2.1],[2.3,2.9],[3,3.1],[3.3,3.9],[4.1,4.3],[4.6,4.9]].map(([start,end]) => {
   const slice = data.slice(start*48000,end*48000);
   const rms = Math.sqrt(slice.reduce((sum,x)=>sum+x*x,0)/slice.length);
   return {start,end,rms,dbfs:rms > 0 ? 20*Math.log10(rms) : null,peak:Math.max(...slice.map(Math.abs))};
  });
  cases.push({kind,windows});
 }
 document.querySelector('pre').textContent=JSON.stringify({sources:${JSON.stringify([soundPath, boxPath])},sampleRate:48000,projectorDuration:4.4,timeOrigin:'numeral 3 appears',cases},null,2);
 document.title='DONE - Countdown WebAudio diagnostic';
})().catch(e => {document.querySelector('pre').textContent=e.stack;document.title='ERROR';});`;
fs.writeFileSync(new URL('./offline-audio.html', import.meta.url), '<!doctype html><title>Countdown WebAudio diagnostic</title><h1>Countdown WebAudio diagnostic</h1><p>Real Chromium WebAudio offline output. Measures signal levels, not perceived audibility. Seconds start at numeral 3.</p><pre>Rendering...</pre><script>' + script + '</script>');
