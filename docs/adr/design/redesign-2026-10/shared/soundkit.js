// Shared synthesized UI sound kit for the variant prototypes.
// Pasted into each artboard's logic class as methods. No audio files: everything is
// generated with the Web Audio API on first user gesture. Mirrors what the real
// Astro build would ship as a tiny `sound.ts` module (≈2 KB, zero deps).
//
// Vocabulary (keep names stable across variants so the user can compare):
//   tick    – 9 ms, hover over nav / list rows / odometer digits. Barely there.
//   click   – 35 ms, primary buttons & toggles. Noise transient + low sine thump.
//   pop     – 70 ms upward sine glide, "on" states, chips, selected.
//   drop    – 90 ms downward glide, "off" states, dismiss, close.
//   type    – 12 ms band-passed noise, one per typed character.
//   chime   – 3-note arpeggio (triangle), the agent finished composing a surface.
//   whoosh  – 220 ms filtered-noise sweep, panels sliding, surfaces entering.
//   wood    – 60 ms resonant blip w/ pitch per index, for the theme bars / sliders.
//
// Every method is a no-op when `this.state.sound` is false or the context can't start.

const SOUNDKIT = `
  ac() {
    if (!this.state.sound) return null;
    try {
      if (!this._ac) this._ac = new (window.AudioContext || window.webkitAudioContext)();
      if (this._ac.state === 'suspended') this._ac.resume();
      return this._ac;
    } catch (e) { return null; }
  }
  // master bus with a gentle limiter so overlapping sounds never clip
  bus(ac) {
    if (!this._bus) {
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 20; comp.ratio.value = 6;
      comp.attack.value = 0.002; comp.release.value = 0.08;
      const g = ac.createGain(); g.gain.value = 0.9;
      comp.connect(g); g.connect(ac.destination);
      this._bus = comp;
    }
    return this._bus;
  }
  noise(ac, dur) {
    const n = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf; return src;
  }
  tone(ac, { type = 'sine', f0 = 440, f1 = f0, dur = 0.05, vol = 0.2, at = 0, curve = 'exp' }) {
    const t = ac.currentTime + at;
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.bus(ac)); o.start(t); o.stop(t + dur + 0.02);
  }
  tick() { const ac = this.ac(); if (!ac) return; this.tone(ac, { type: 'sine', f0: 1800, f1: 1200, dur: 0.009, vol: 0.08 }); }
  click() {
    const ac = this.ac(); if (!ac) return; const t = ac.currentTime;
    const n = this.noise(ac, 0.03); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.9;
    const g = ac.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    n.connect(bp); bp.connect(g); g.connect(this.bus(ac)); n.start(t);
    this.tone(ac, { type: 'sine', f0: 180, f1: 90, dur: 0.045, vol: 0.25 });
  }
  pop() { const ac = this.ac(); if (!ac) return; this.tone(ac, { type: 'sine', f0: 320, f1: 880, dur: 0.07, vol: 0.18 }); }
  drop() { const ac = this.ac(); if (!ac) return; this.tone(ac, { type: 'sine', f0: 620, f1: 160, dur: 0.09, vol: 0.16 }); }
  type() {
    const ac = this.ac(); if (!ac) return; const t = ac.currentTime;
    const n = this.noise(ac, 0.012); const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200 + Math.random() * 1400; bp.Q.value = 1.4;
    const g = ac.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    n.connect(bp); bp.connect(g); g.connect(this.bus(ac)); n.start(t);
  }
  chime() {
    const ac = this.ac(); if (!ac) return;
    [[523.25, 0], [659.25, 0.07], [987.77, 0.14]].forEach(([f, at]) => this.tone(ac, { type: 'triangle', f0: f, dur: 0.38, vol: 0.12, at }));
  }
  whoosh() {
    const ac = this.ac(); if (!ac) return; const t = ac.currentTime;
    const n = this.noise(ac, 0.22); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7;
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(5000, t + 0.1); lp.frequency.exponentialRampToValueAtTime(400, t + 0.22);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(lp); lp.connect(g); g.connect(this.bus(ac)); n.start(t);
  }
  wood(i) {
    const ac = this.ac(); if (!ac) return;
    const f = 440 * Math.pow(2, ((i || 0) % 8) / 12);
    this.tone(ac, { type: 'sine', f0: f * 2, f1: f, dur: 0.06, vol: 0.2 });
    this.tone(ac, { type: 'triangle', f0: f * 4, f1: f * 2.5, dur: 0.03, vol: 0.06 });
  }
  toggleSound() {
    const next = !this.state.sound;
    this.setState({ sound: next }, () => { if (next) this.pop(); });
  }
`;
export default SOUNDKIT;
