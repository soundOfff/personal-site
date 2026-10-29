/*
  Darkroom pixel engine.

  Plate = { root, img, canvas, frames, frame, level }
    level steps through LEVELS = [24, 12, 6, 3, 0]: the cell size in CSS px, 0 is the real image.
  A level is rendered once per (source, level, size) into a tiny cols x rows canvas of dither tones,
  then blown up with smoothing off, so every cell is a crisp square. getImageData only runs on a cache miss.
*/
(function () {
  const LEVELS = [24, 12, 6, 3, 0];
  const EXPOSURE = { 24: 0.62, 12: 0.74, 6: 0.88, 3: 1 };
  const TONES = [[17, 18, 20], [0, 36, 204], [246, 245, 241]];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = t => 1 - Math.pow(1 - t, 3);

  const pending = new Map();
  const ready = new Map();
  function load(src) {
    if (!src) return Promise.resolve(null);
    if (!pending.has(src)) {
      pending.set(src, new Promise(resolve => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { ready.set(src, img); resolve(img); };
        img.onerror = () => resolve(null);
        img.src = src;
      }));
    }
    return pending.get(src);
  }

  function field(key, opts = {}) {
    if (ready.has(key)) return ready.get(key);
    const c = document.createElement('canvas');
    c.width = 160; c.height = 120;
    const x = c.getContext('2d');
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = (h % 360) * Math.PI / 180;
    const g = x.createLinearGradient(80 - Math.cos(a) * 110, 60 - Math.sin(a) * 110, 80 + Math.cos(a) * 110, 60 + Math.sin(a) * 110);
    g.addColorStop(0, '#0a0b10');
    g.addColorStop(0.45, '#2a3fb8');
    g.addColorStop(1, '#f2f1ec');
    x.fillStyle = g;
    x.fillRect(0, 0, 160, 120);
    const r = x.createRadialGradient(40 + (h % 80), 30 + (h % 60), 4, 40 + (h % 80), 30 + (h % 60), 70);
    r.addColorStop(0, 'rgba(255,255,255,.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = r;
    x.fillRect(0, 0, 160, 120);
    if (opts.glyph) {
      x.fillStyle = '#0b0c10';
      x.font = '900 118px system-ui, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(opts.glyph, 80, 66);
    }
    ready.set(key, c);
    return c;
  }

  const stats = new Map();
  function stretch(src, source) {
    if (stats.has(src)) return stats.get(src);
    const c = document.createElement('canvas');
    c.width = 48; c.height = 48;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(source, 0, 0, 48, 48);
    const p = x.getImageData(0, 0, 48, 48).data;
    const lum = [];
    for (let i = 0; i < p.length; i += 4) lum.push((0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255);
    lum.sort((a, b) => a - b);
    const lo = lum[Math.floor(lum.length * 0.04)], hi = lum[Math.floor(lum.length * 0.96)];
    const s = { lo: Math.min(lo, 0.35), hi: Math.max(hi, lo + 0.25) };
    stats.set(src, s);
    return s;
  }

  const levels = new Map();
  function ditherLevel(src, source, W, H, level, pos, exposure = 1) {
    const key = `${src}|${level}|${W}x${H}|${pos}|${exposure}`;
    const hit = levels.get(key);
    if (hit) return hit;
    const cols = Math.ceil(W / level), rows = Math.ceil(H / level);
    const c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    const x = c.getContext('2d', { willReadFrequently: true });
    const sw0 = source.naturalWidth || source.width, sh0 = source.naturalHeight || source.height;
    const scale = Math.max(W / sw0, H / sh0);
    const sw = W / scale, sh = H / scale;
    const sx = (sw0 - sw) * pos[0], sy = (sh0 - sh) * pos[1];
    x.fillStyle = '#f6f5f1';
    x.fillRect(0, 0, cols, rows);
    x.imageSmoothingQuality = 'high';
    x.drawImage(source, sx, sy, (cols * level) / scale, (rows * level) / scale, 0, 0, cols, rows);
    const data = x.getImageData(0, 0, cols, rows);
    const p = data.data;
    const { lo, hi } = stretch(src, source);
    for (let i = 0, n = cols * rows; i < n; i++) {
      const o = i * 4;
      let v = (0.2126 * p[o] + 0.7152 * p[o + 1] + 0.0722 * p[o + 2]) / 255;
      v = Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * exposure;
      const cx = i % cols, cy = (i / cols) | 0;
      const t = v * 2;
      let k = Math.floor(t);
      if (t - k > BAYER[(cy & 3) * 4 + (cx & 3)]) k++;
      const tone = TONES[Math.min(2, k)];
      p[o] = tone[0]; p[o + 1] = tone[1]; p[o + 2] = tone[2]; p[o + 3] = 255;
    }
    x.putImageData(data, 0, 0);
    levels.set(key, c);
    return c;
  }

  const tasks = new Set();
  let raf = 0;
  const runnable = t => !document.hidden && (!t.plate || t.plate.visible);
  function kick() {
    if (!raf && [...tasks].some(runnable)) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    for (const t of [...tasks]) if (runnable(t) && t.fn(now) === false) tasks.delete(t);
    kick();
  }
  function addTask(fn, plate = null) {
    const t = { fn, plate };
    tasks.add(t);
    kick();
    return () => tasks.delete(t);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else kick();
  });

  const visibility = new IntersectionObserver(entries => {
    for (const e of entries) {
      const plate = e.target.__plate;
      if (!plate) continue;
      if (e.isIntersecting && !plate.visible) plate.onReveal?.();
      plate.visible = e.isIntersecting;
    }
    kick();
  });

  class Plate {
    constructor(root, opts = {}) {
      this.root = root;
      this.img = root.querySelector('img');
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.frames = opts.frames || (this.img ? [this.img.getAttribute('src')] : []);
      this.source = opts.source || null;
      this.sourceKey = opts.sourceKey || null;
      this.pos = opts.pos || [0.5, 0];
      this.frame = 0;
      this.level = opts.level ?? 24;
      this.visible = true;
      this.run = null;
      this.W = 0; this.H = 0;
      root.__plate = this;
      visibility.observe(root);
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(root);
      this.resize();
      this.frames.forEach(load);
    }
    get src() { return this.sourceKey || this.frames[this.frame]; }
    get sourceImage() { return this.source || ready.get(this.frames[this.frame]) || null; }
    resize() {
      const W = Math.round(this.root.clientWidth), H = Math.round(this.root.clientHeight);
      if (!W || !H || (W === this.W && H === this.H)) return;
      this.W = W; this.H = H;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.draw();
    }
    draw() {
      const { level } = this;
      if (!level || !this.W) return;
      const source = this.sourceImage || field('placeholder');
      const src = this.sourceImage ? this.src : 'placeholder';
      const small = ditherLevel(src, source, this.W, this.H, level, this.pos, EXPOSURE[level] ?? 1);
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const cell = Math.round(level * this.dpr);
      this.ctx.drawImage(small, 0, 0, small.width * cell, small.height * cell);
    }
    paint(level, mix = level ? 0 : 1) {
      this.level = level;
      this.canvas.style.opacity = String(1 - mix);
      this.root.style.setProperty('--sat', mix.toFixed(3));
      this.root.dataset.level = level;
      this.draw();
    }
    stop() { if (this.run) { this.run(); this.run = null; } }
    snap(level = 24) { this.stop(); this.paint(level); }
    develop({ delay = 0, from = [24, 12, 6, 3], step = 180, fade = 680 } = {}) {
      this.stop();
      if (reducedMQ.matches) { this.paint(0); return Promise.resolve(); }
      this.paint(from[0]);
      return new Promise(resolve => {
        let t = -delay, last = 0, current = -1;
        const total = from.length * step + fade;
        let real = !!this.sourceImage;
        this.onReveal = () => { if (t < 0) t = 0; };
        this.run = addTask(now => {
          const dt = last ? Math.min(64, now - last) : 0;
          last = now;
          if (!this.sourceImage) { t = Math.min(t + dt, 0); return true; }
          if (!real) { real = true; current = -1; this.paint(from[0]); }
          t += dt;
          if (t < 0) return true;
          if (t < from.length * step) {
            const i = Math.min(from.length - 1, Math.floor(t / step));
            if (i !== current) { current = i; this.paint(from[i]); }
            return true;
          }
          if (t < total) {
            const m = ease((t - from.length * step) / fade);
            if (this.level !== from[from.length - 1]) this.paint(from[from.length - 1], m);
            this.canvas.style.opacity = String(1 - m);
            this.root.style.setProperty('--sat', m.toFixed(3));
            return true;
          }
          this.paint(0);
          this.run = null;
          this.onReveal = null;
          resolve();
          return false;
        }, this);
      });
    }
    show(index, { quick = true } = {}) {
      if (index === this.frame || !this.frames[index]) return;
      this.frame = index;
      if (this.img) this.img.src = this.frames[index];
      this.root.dataset.frame = index;
      if (quick) this.develop({ from: [6, 3], step: 40, fade: 40 });
      else this.paint(0);
    }
    destroy() {
      this.stop();
      this.ro.disconnect();
      visibility.unobserve(this.root);
    }
  }

  function paintStatic(canvas, source, key, level) {
    const W = Math.round(canvas.clientWidth), H = Math.round(canvas.clientHeight);
    if (!W || !H) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const small = ditherLevel(key, source, W, H, level, [0.5, 0.5]);
    const x = canvas.getContext('2d');
    x.imageSmoothingEnabled = false;
    const cell = Math.round(level * dpr);
    x.drawImage(small, 0, 0, small.width * cell, small.height * cell);
  }

  window.Darkroom = { LEVELS, Plate, load, ready, field, addTask, paintStatic, reducedMQ };
})();
