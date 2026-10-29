(() => {
  const S = window.SITE;
  const D = window.Darkroom;
  const ORIGIN = 'https://tomasbrasca.xyz';
  const root = document.documentElement;
  const reducedMQ = D.reducedMQ;
  const hoverMQ = matchMedia('(hover: hover) and (pointer: fine)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const media = p => (p ? '../shared/' + p : null);
  const pad = n => String(n).padStart(2, '0');
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const smooth = () => (reducedMQ.matches ? 'auto' : 'smooth');
  const decode = s => { try { return decodeURIComponent(s); } catch { return null; } };

  /* ---------- Domain ---------- */

  const parse = html => { const t = document.createElement('template'); t.innerHTML = html || ''; return t.content; };

  const COVER = ['sift', 'focus-quote', 'catcher', 'dex', 'dana'];
  const COVER_SUB = { sift: 'Chrome extension', 'focus-quote': 'Reading tool', catcher: 'Capture tool', dex: 'LLM routing', dana: 'AI integrations' };
  const CATEGORIES = ['Experience', 'Product', 'Open source', 'Experiment'];

  const WORK = S.work.map((w, i) => {
    const frag = parse(w.bodyHtml);
    const kids = [...frag.children];
    const imgs = $$('img', frag).map(im => im.getAttribute('src'));
    return {
      ...w,
      n: i + 1,
      cat: w.tags[0],
      stack: w.tags.slice(1),
      img: media(w.image),
      frames: [...new Set([w.image, ...imgs].filter(Boolean))].map(media),
      dek: kids[0]?.tagName === 'P' ? kids[0].textContent : '',
      status: kids[1]?.tagName === 'P' ? kids[1].textContent : '',
    };
  });
  const WORK_BY = new Map(WORK.map(w => [w.slug, w]));

  const THEMES = [
    { id: 'all', label: 'All' },
    { id: 'algorithms', label: 'Algorithms', tags: ['algorithms', 'binary-search', 'graphs', 'data-structures', 'icpc', 'bfs', 'dfs', 'dijkstra', 'invariants'] },
    { id: 'ai', label: 'AI and evals', tags: ['ai', 'llm', 'evals', 'routing', 'ai-products'] },
    { id: 'building', label: 'Building', tags: ['astro', 'architecture', 'cloudflare', 'rate-limiting', 'design-systems', 'css', 'open-source', 'security', 'edge', 'kv', 'islands', 'load-testing', 'capacity-planning', 'testing', 'react'] },
    { id: 'career', label: 'Career', tags: ['career', 'interviews', 'job-hunting', 'startups'] },
  ];
  const POSTS = S.posts.map((p, i) => ({
    ...p,
    i,
    dateLabel: fmtDate(p.date),
    themes: THEMES.filter(t => t.tags && p.tags.some(x => t.tags.includes(x))).map(t => t.id),
    url: `${ORIGIN}/blog/${p.slug}`,
  }));
  const POST_BY = new Map(POSTS.map(p => [p.slug, p]));

  function mapHref(h) {
    if (/^(https?:|mailto:|#)/.test(h)) return h;
    if (h === '/work/flagship') return '#/work/a2ui';
    if (h.startsWith('/work/')) return '#' + h;
    if (h.startsWith('/showcase/')) return '#/work/' + h.slice(10);
    if (h.startsWith('/blog/')) return '#' + h;
    if (h === '/blog') return '#/blog';
    return ORIGIN + h;
  }

  function prepBody(html, { skipLead = 0, skipImg = null } = {}) {
    const frag = parse(String(html).replace(/src="media\//g, 'src="../shared/media/'));
    for (let i = 0; i < skipLead; i++) if (frag.firstElementChild?.tagName === 'P') frag.firstElementChild.remove();
    if (skipImg) $$('figure', frag).forEach(f => { if ($('img', f)?.getAttribute('src') === skipImg) f.remove(); });
    $$('a[href]', frag).forEach(a => {
      const h = mapHref(a.getAttribute('href'));
      a.setAttribute('href', h);
      if (/^https?:/.test(h)) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    $$('table', frag).forEach(t => {
      const w = document.createElement('div');
      w.className = 'table-wrap';
      w.tabIndex = 0;
      w.setAttribute('role', 'region');
      w.setAttribute('aria-label', 'Table');
      t.replaceWith(w);
      w.append(t);
    });
    $$('pre', frag).forEach(p => { p.tabIndex = 0; });
    $$('img', frag).forEach(im => { im.loading = 'lazy'; });
    const used = new Set();
    $$('h2, h3', frag).forEach(h => {
      let id = slugify(h.textContent) || 'section';
      while (used.has(id)) id += '-2';
      used.add(id);
      h.id = id;
    });
    return frag;
  }

  /* ---------- Shared bits ---------- */

  function twoTone(solid, ghost, tag = 'h2', attrs = '') {
    return `<${tag} class="two-tone" ${attrs}><span class="solid">${esc(solid)}</span> <span class="ghost">${esc(ghost)}</span></${tag}>`;
  }

  function typeCard(w) {
    return `<div class="type-card"><canvas class="type-block" data-field="${w.slug}" aria-hidden="true"></canvas><span class="type-title" aria-hidden="true">${esc(w.title)}</span></div>`;
  }

  function workCard(w, size = '') {
    const visual = w.img ? `<img src="${w.img}" alt="" loading="lazy" decoding="async">` : typeCard(w);
    return `<a class="card ${size}" href="#/work/${w.slug}" data-morph="work" data-slug="${w.slug}" data-cat="${esc(w.cat)}">
      <div class="card-media" data-morph-img>${visual}<span class="tab mono">${esc(w.cat)}</span></div>
      <div class="card-body">
        <h3 class="card-title"><span data-morph-title style="display:inline-block">${esc(w.title)}</span></h3>
        <p class="card-sum">${esc(w.summary)}</p>
        <p class="card-meta mono">${pad(w.n)} · ${w.stack.map(esc).join(' · ')}</p>
      </div>
    </a>`;
  }

  function highlight(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function postCard(p, size = '', q = '') {
    return `<a class="pcard ${size}" href="#/blog/${p.slug}" data-morph="post" data-slug="${p.slug}">
      <span class="pcard-num" aria-hidden="true">${p.readingMinutes}</span>
      <p class="mono pcard-meta"><time datetime="${p.date}">${p.dateLabel}</time><span class="dot">·</span><span>${p.readingMinutes} min read</span>${p.featured ? '<span class="dot">·</span><span>Featured</span>' : ''}</p>
      <h3 class="pcard-title"><span data-morph-title style="display:inline">${highlight(p.title, q)}</span></h3>
      <p class="pcard-ex">${highlight(p.description, q)}</p>
      <p class="mono pcard-tags">${p.tags.slice(0, 3).map(t => '#' + esc(t)).join('  ')}</p>
    </a>`;
  }

  function paintFields(scope, level = 6) {
    $$('canvas[data-field]', scope).forEach(c => {
      const key = 'field:' + c.dataset.field;
      D.paintStatic(c, D.field(key), key, level);
    });
  }

  const measureCtx = document.createElement('canvas').getContext('2d');
  function ink(text) {
    measureCtx.font = '900 100px "Archivo Variable"';
    measureCtx.fontStretch = 'expanded';
    const m = measureCtx.measureText(text);
    return { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
  }
  function fitSvg(svg) {
    const texts = $$('text', svg);
    if (texts.length === 1) {
      const m = ink(texts[0].textContent);
      svg.setAttribute('viewBox', `${-m.l} ${-m.a} ${m.l + m.r} ${m.a + m.d}`);
    } else {
      const [t1, t2] = texts;
      const m1 = ink(t1.textContent), m2 = ink(t2.textContent);
      const indent = svg.dataset.indent ? (m1.l + m1.r) * Number(svg.dataset.indent) : 0;
      const y2 = m1.d + m2.a + m1.a * 0.14;
      t2.setAttribute('x', indent);
      t2.setAttribute('y', y2);
      const x0 = Math.min(-m1.l, indent - m2.l), x1 = Math.max(m1.r, indent + m2.r);
      svg.setAttribute('viewBox', `${x0} ${-m1.a} ${x1 - x0} ${y2 + m2.d + m1.a}`);
    }
    svg.classList.add('fitted');
  }
  let fontsReady = false;
  const fontLoad = Promise.all([
    document.fonts.load('900 100px "Archivo Variable"'),
    document.fonts.load('500 16px "Geist Variable"'),
  ]).catch(() => {}).then(() => { fontsReady = true; });
  function fitWords(scope = document) {
    const run = () => $$('svg[data-fit]', scope).forEach(fitSvg);
    if (fontsReady) run(); else fontLoad.then(run);
  }

  const scrollSubs = new Set();
  let scrollQueued = false;
  addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      const y = window.scrollY;
      scrollSubs.forEach(f => f(y));
    });
  }, { passive: true });

  /* ---------- Plates on the cover ---------- */

  function bindScrub(a, plate) {
    const bar = $('.scrub', a);
    const ticks = $$('.plate-ticks i', a);
    const counter = $('.plate-frame', a);
    const n = plate.frames.length;
    let target = 0, x = 0, inside = false, stop = null, sx = null, sy = 0, swiping = false, swallow = false;
    const mark = () => {
      ticks.forEach((t, i) => t.classList.toggle('on', i === plate.frame));
      if (counter) counter.textContent = `${pad(plate.frame + 1)}/${pad(n)}`;
    };
    const step = () => {
      x += (target - x) * 0.12;
      bar.style.transform = `translateX(${(x * a.clientWidth).toFixed(1)}px)`;
      const f = Math.min(n - 1, Math.floor(x * n));
      if (inside && f !== plate.frame) { plate.show(f); mark(); }
      if (Math.abs(target - x) < 0.002) { stop = null; return false; }
      return true;
    };
    const rel = e => { const r = a.getBoundingClientRect(); return Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)); };
    a.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || !hoverMQ.matches) return;
      inside = true;
      target = x = rel(e);
      a.classList.add('scrubbing');
      plate.frames.forEach(D.load);
      if (!stop) stop = D.addTask(step);
    });
    a.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse') { if (inside) { target = rel(e); if (!stop) stop = D.addTask(step); } return; }
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!swiping && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) swiping = true;
    });
    a.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse' || !inside) return;
      inside = false;
      a.classList.remove('scrubbing');
      if (plate.frame !== 0) { plate.show(0); mark(); }
    });
    a.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; swiping = false; } });
    a.addEventListener('pointercancel', () => { sx = null; swiping = false; });
    a.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse' || sx == null) return;
      if (swiping) {
        const dir = e.clientX - sx < 0 ? 1 : -1;
        if (n > 1) plate.show((plate.frame + dir + n) % n);
        else plate.develop({ from: [6, 3], step: 40, fade: 40 });
        mark();
        swallow = true;
      }
      sx = null;
      swiping = false;
    });
    a.addEventListener('click', e => { if (swallow) { e.preventDefault(); e.stopImmediatePropagation(); swallow = false; } }, true);
    const live = a.closest('.cover')?.querySelector('[data-scrub-live]');
    const title = WORK_BY.get(a.dataset.slug)?.title || '';
    a.addEventListener('keydown', e => {
      if ((e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') || e.altKey || e.metaKey || e.ctrlKey || n < 2) return;
      e.preventDefault();
      const f = (plate.frame + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      plate.show(f);
      mark();
      x = target = (f + 0.5) / n;
      bar.style.transform = `translateX(${(x * a.clientWidth).toFixed(1)}px)`;
      a.classList.add('scrubbing', 'keyed');
      if (live) live.textContent = `${title}, screenshot ${f + 1} of ${n}.`;
    });
    a.addEventListener('focusout', () => {
      if (!a.classList.contains('keyed')) return;
      a.classList.remove('scrubbing', 'keyed');
      if (plate.frame !== 0) { plate.show(0, { quick: false }); mark(); }
    });
    mark();
    return () => stop?.();
  }

  function coverPlate(w, i) {
    const n = w.frames.length;
    return `<li><a class="plate" href="#/work/${w.slug}" data-morph="work" data-slug="${w.slug}" aria-label="${esc(w.title)}, ${esc(COVER_SUB[w.slug])}${n > 1 ? `, ${n} screenshots` : ''}"${n > 1 ? ' aria-describedby="sheet-note"' : ''}>
      <div class="plate-media" data-plate data-morph-img>
        <img class="plate-img" src="${w.img}" alt="" decoding="async">
        <canvas class="plate-dither" aria-hidden="true"></canvas>
        <span class="scrub" aria-hidden="true"></span>
      </div>
      <span class="plate-cap mono" aria-hidden="true">
        <span class="cap-l">${pad(i + 1)} <b data-morph-title style="display:inline-block">${esc(w.title)}</b></span>
        <span class="plate-ticks">${n > 1 ? w.frames.map(() => '<i></i>').join('') : ''}<span class="plate-frame"></span></span>
      </span>
      <span class="plate-sub mono" aria-hidden="true">${esc(COVER_SUB[w.slug])}</span>
    </a></li>`;
  }

  /* ---------- Routes ---------- */

  function renderHome(view, params, ctx) {
    const sel = COVER.map(s => WORK_BY.get(s));
    const counts = Object.fromEntries(CATEGORIES.map(c => [c, WORK.filter(w => w.cat === c).length]));
    const featured = POSTS.filter(p => p.featured);
    view.innerHTML = `
    <section class="cover" aria-labelledby="hero-title">
      <h1 class="cover-h1" id="hero-title" tabindex="-1">
        <span class="sr-only">Tomas Brasca. Ideas made useful.</span>
        <svg class="fit-word cover-word cover-word-wide" data-fit aria-hidden="true"><text x="0" y="0">TOMAS BRASCA</text></svg>
        <svg class="fit-word cover-word cover-word-stair" data-fit data-indent="0.36" aria-hidden="true"><text x="0" y="0">TOMAS</text><text x="0" y="0">BRASCA</text></svg>
      </h1>
      <div class="cover-line">
        <p class="two-tone cover-tag" aria-hidden="true"><span class="solid">Ideas</span> <span class="ghost">made useful.</span></p>
        <div class="cover-side">
          <p class="cover-sum">${esc(S.home[0].summary)}</p>
          <p class="mono cover-meta">${esc(S.person.role)} · ${esc(S.person.location)}</p>
        </div>
      </div>
      <ol class="sheet" aria-label="Contact sheet of selected work">${sel.map(coverPlate).join('')}</ol>
      <p class="mono sheet-note" id="sheet-note">${hoverMQ.matches ? 'Move across a plate, or focus it and press ← →, to scrub its screenshots.' : 'Swipe a plate sideways to see more screenshots. Tap to open.'}</p>
      <p class="sr-only" aria-live="polite" data-scrub-live></p>
    </section>

    <section class="sec" id="work" aria-labelledby="work-title">
      <header class="sec-head">
        ${twoTone('Products', 'in focus.', 'h2', 'id="work-title"')}
        <p class="sec-sum">${esc(S.home[1].summary)}</p>
      </header>
      <div class="zig">${workCard(WORK_BY.get('sift'), 'wide')}${workCard(WORK_BY.get('focus-quote'), 'narrow')}</div>
      <header class="sec-head sub">
        ${twoTone('Built in teams.', 'Shipped in the world.')}
        <p class="sec-sum">${esc(S.home[2].summary)}</p>
      </header>
      <div class="zig rev">${workCard(WORK_BY.get('mint'), 'narrow')}${workCard(WORK_BY.get('dex'), 'wide')}</div>
    </section>

    <section class="sec" id="index" aria-labelledby="index-title">
      <header class="sec-head">
        ${twoTone('The whole', 'body of work.', 'h2', 'id="index-title"')}
        <p class="sec-sum">${esc(S.home[3].summary)}</p>
      </header>
      <div class="filters" role="group" aria-label="Filter projects by category">
        <button class="chip" type="button" data-cat="All" aria-pressed="true">All <span class="n">${WORK.length}</span></button>
        ${CATEGORIES.map(c => `<button class="chip" type="button" data-cat="${c}" aria-pressed="false">${c} <span class="n">${counts[c]}</span></button>`).join('')}
        <span class="filter-count mono" aria-live="polite">${WORK.length} projects</span>
      </div>
      <div class="grid">${WORK.map(w => workCard(w)).join('')}</div>
    </section>

    <section class="sec" id="readme" aria-labelledby="about-title">
      <header class="sec-head">
        ${twoTone('Curious by default.', 'Practical by experience.', 'h2', 'id="about-title"')}
      </header>
      <div class="about-grid">
        <div class="about-bio">${S.person.bio.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <div>
          <ul class="facts">
            <li><span class="k">Based in</span><span>Rosario, Argentina · UTC−3</span></li>
            <li><span class="k">Practice</span><span>Full-stack, 5+ years. Web, mobile, APIs, AI systems.</span></li>
            <li><span class="k">Contests</span><span>ICPC South America finalist</span></li>
            <li><span class="k">Trading</span><span>1st place, GTS algorithmic trading competition</span></li>
            <li><span class="k">Now</span><span>AI products, developer tools, learning systems</span></li>
          </ul>
          <div class="about-links">
            <a class="btn line" href="https://github.com/soundOfff" target="_blank" rel="noopener">GitHub ↗</a>
            <a class="btn line" href="https://www.linkedin.com/in/tomasbrasca" target="_blank" rel="noopener">LinkedIn ↗</a>
            <a class="btn" href="../shared/media/cv.pdf" target="_blank" rel="noopener">Résumé ↗</a>
          </div>
        </div>
      </div>
    </section>

    <section class="sec" id="writing" aria-labelledby="writing-title">
      <header class="sec-head">
        ${twoTone('On the', 'page.', 'h2', 'id="writing-title"')}
        <p class="sec-sum">Notes on algorithms, evals and the unglamorous middle between a demo and a product.</p>
      </header>
      <div class="posts-2">${featured.map(p => postCard(p, 'big')).join('')}</div>
      <a class="giant-cta" href="#/blog"><span class="par">(</span>all writing <span class="arr">→</span><span class="par">)</span></a>
    </section>

    <section class="sec" id="playground" aria-labelledby="ask-title" style="padding-top:0">
      <div class="ask">
        <div>
          <p class="eyebrow mono"><b>Live agent</b><span>on tomasbrasca.xyz</span></p>
          ${twoTone('Ask about', 'my work.', 'h2', 'id="ask-title"')}
          <p class="sec-sum" style="margin:18px 0 22px">${esc(S.home[6].summary)}</p>
          <a class="btn" href="${ORIGIN}/#playground" target="_blank" rel="noopener">Ask on tomasbrasca.xyz ↗</a>
        </div>
        <ul class="ask-qs">
          ${['How did Sift turn lecture audio into notes?', 'Compare Dex and Mint as engineering work.', 'What does ICPC have to do with production code?'].map(q => `<li><a href="${ORIGIN}/#playground" target="_blank" rel="noopener"><span>${esc(q)}</span><span aria-hidden="true">↗</span></a></li>`).join('')}
        </ul>
      </div>
    </section>`;

    paintFields(view);
    const offs = [];
    const plates = $$('.sheet .plate', view).map((a, i) => {
      const w = WORK_BY.get(a.dataset.slug);
      const plate = new D.Plate($('[data-plate]', a), { frames: w.frames, pos: [0.5, 0] });
      offs.push(bindScrub(a, plate));
      return plate;
    });
    if (ctx.morph?.kind === 'work' && COVER.includes(ctx.morph.slug)) {
      const a = $(`.sheet .plate[data-slug="${ctx.morph.slug}"]`, view);
      nameMorph(a, ctx.morph.slug, 'work');
    }
    const base = ctx.first ? 150 : 260;
    const developAll = (delay = base) => plates.forEach((p, i) => p.develop({ delay: delay + i * 120 }));
    developAll();

    let left = false;
    const sheet = $('.sheet', view);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) {
        if (!left) { left = true; plates.forEach(p => p.snap(24)); }
      } else if (left) {
        left = false;
        developAll(80);
      }
    });
    io.observe(sheet);

    const chips = $$('.filters .chip', view);
    const cards = $$('.grid .card', view);
    const count = $('.filter-count', view);
    const filter = cat => {
      const apply = () => {
        chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === cat)));
        let shown = 0;
        cards.forEach(c => { const on = cat === 'All' || c.dataset.cat === cat; c.hidden = !on; shown += on; });
        count.textContent = `${shown} ${shown === 1 ? 'project' : 'projects'}${cat === 'All' ? '' : ' in ' + cat}`;
      };
      if (!document.startViewTransition || reducedMQ.matches) return apply();
      cards.forEach(c => { c.style.viewTransitionName = 'card-' + c.dataset.slug; });
      root.dataset.vt = 'filter';
      const t = document.startViewTransition(apply);
      t.finished.finally(() => {
        cards.forEach(c => { c.style.viewTransitionName = ''; });
        if (root.dataset.vt === 'filter') delete root.dataset.vt;
      });
    };
    chips.forEach(c => c.addEventListener('click', () => filter(c.dataset.cat)));

    const spy = () => {
      const line = innerHeight * 0.4;
      let key = null;
      for (const id of ['work', 'index']) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < line && el.getBoundingClientRect().bottom > line) key = id;
      }
      homeSection = key;
      updateNav();
    };
    scrollSubs.add(spy);
    spy();

    return () => {
      io.disconnect();
      scrollSubs.delete(spy);
      offs.forEach(f => f());
      plates.forEach(p => p.destroy());
      homeSection = null;
    };
  }

  function renderWork(view, [slug], ctx) {
    const w = WORK_BY.get(slug);
    if (!w) return false;
    const next = WORK[w.n % WORK.length];
    const morphed = ctx.morph?.kind === 'work' && ctx.morph.slug === slug;
    const heroSrc = (ctx.morph?.slug === slug && w.frames[ctx.morph.frame]) || w.img;
    const backdropSrc = heroSrc || D.field('field:' + w.slug).toDataURL();
    const facts = [
      ['Role', w.role],
      ['Stack', w.stack.join(', ')],
      w.year && ['Year', w.year],
      w.status && ['Format', w.status],
    ].filter(Boolean);
    view.innerHTML = `
    <article class="wd">
      <header class="wd-hero">
        <div class="wd-backdrop" data-backdrop aria-hidden="true">
          <img class="plate-img" src="${backdropSrc}" alt="">
          <canvas class="plate-dither"></canvas>
        </div>
        <p class="mono wd-crumb"><a href="#/" data-section="index">Index</a><span class="sep">/</span><span>${esc(w.cat)}</span><span class="sep">/</span><span>${pad(w.n)} of ${WORK.length}</span></p>
        <h1 class="wd-title" tabindex="-1"><span class="t" data-hero-title>${esc(w.title)}</span></h1>
        ${w.dek ? `<p class="wd-dek">${esc(w.dek)}</p>` : ''}
        <ul class="wd-meta mono">${facts.map(([k, v]) => `<li><span class="k">${k}</span><span>${esc(v)}</span></li>`).join('')}</ul>
        <div class="wd-actions">
          ${w.href ? `<a class="btn" href="${esc(w.href)}" target="_blank" rel="noopener">${/github\.com/.test(w.href) ? 'View source' : 'Visit website'} ↗</a>` : ''}
          <a class="btn line" href="#/" data-section="index">All projects</a>
        </div>
      </header>
      <figure class="wd-figure" data-hero-img>
        ${heroSrc ? `<img class="plate-img" src="${heroSrc}" alt="${esc(w.title)} screenshot">${morphed ? '' : '<canvas class="plate-dither" aria-hidden="true"></canvas>'}` : typeCard(w)}
      </figure>
      <div class="prose wd-body"></div>
      <a class="wd-next" href="#/work/${next.slug}"><span class="mono">Next project · ${pad(next.n)} of ${WORK.length}</span><strong>${esc(next.title)} →</strong></a>
    </article>`;
    $('.wd-body', view).append(prepBody(w.bodyHtml, { skipLead: (w.dek ? 1 : 0) + (w.status ? 1 : 0), skipImg: heroSrc }));
    paintFields(view, 8);
    if (morphed) {
      nameEl($('[data-hero-img]', view), `work-${slug}`, 'morph');
      nameEl($('[data-hero-title]', view), `wtitle-${slug}`, 'morph-text');
    }
    const plates = [new D.Plate($('[data-backdrop]', view), { frames: [backdropSrc], pos: [0.5, 0.3] })];
    plates[0].develop({ delay: ctx.first ? 120 : 260, step: 130, fade: 520 });
    if (heroSrc && !morphed) {
      plates.push(new D.Plate($('[data-hero-img]', view), { frames: [heroSrc], pos: [0.5, 0] }));
      plates[1].develop({ delay: ctx.first ? 220 : 340, step: 160, fade: 620 });
    }
    return () => plates.forEach(p => p.destroy());
  }

  function blogTheme(id) { return THEMES.find(t => t.id === id); }

  function renderBlog(view, params, ctx) {
    let theme = 'all', q = '';
    view.innerHTML = `
    <div class="paper">
      <header class="blog-hero">
        ${twoTone('Thinking', 'out loud.', 'h1', 'tabindex="-1"')}
        <p class="mono" style="color:var(--muted)">${POSTS.length} articles · ${THEMES.length - 1} themes · Algorithms, AI products, and the work around them.</p>
      </header>
      <div class="blog-bar">
        <div class="chips" role="group" aria-label="Filter posts by theme">
          ${THEMES.map(t => `<button class="chip" type="button" data-theme="${t.id}" aria-pressed="${t.id === 'all'}">${t.label} <span class="n">${t.id === 'all' ? POSTS.length : POSTS.filter(p => p.themes.includes(t.id)).length}</span></button>`).join('')}
        </div>
        <div class="blog-search">
          <label class="sr-only" for="blog-q">Search posts</label>
          <input id="blog-q" type="search" placeholder="Search titles and topics" autocomplete="off">
          <button class="clear" type="button" aria-label="Clear search" hidden>×</button>
        </div>
      </div>
      <div class="blog-body">
        <p class="blog-count mono" aria-live="polite"></p>
        <div class="posts-2" data-featured></div>
        <div class="posts-3" data-grid></div>
        <div class="empty" hidden>
          <h2>Nothing matches yet.</h2>
          <p data-empty-msg></p>
          <button class="btn" type="button" data-reset>Clear search and filters</button>
        </div>
      </div>
    </div>`;
    const input = $('#blog-q', view);
    const clear = $('.clear', view);
    const featuredEl = $('[data-featured]', view);
    const gridEl = $('[data-grid]', view);
    const countEl = $('.blog-count', view);
    const empty = $('.empty', view);
    const chips = $$('.chip', view);
    const match = p => {
      if (!q) return true;
      const s = q.toLowerCase();
      return p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.tags.some(t => t.includes(s));
    };
    const apply = () => {
      const list = POSTS.filter(p => (theme === 'all' || p.themes.includes(theme)) && match(p));
      const showFeatured = theme === 'all' && !q;
      featuredEl.innerHTML = showFeatured ? list.filter(p => p.featured).map(p => postCard(p, 'big')).join('') : '';
      featuredEl.hidden = !showFeatured;
      gridEl.innerHTML = (showFeatured ? list.filter(p => !p.featured) : list).map(p => postCard(p, '', q)).join('');
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.theme === theme)));
      clear.hidden = !q;
      const label = theme === 'all' ? '' : ` in ${blogTheme(theme).label}`;
      countEl.textContent = list.length ? `${list.length} ${list.length === 1 ? 'post' : 'posts'}${label}${q ? ` matching “${q}”` : ''}` : '';
      empty.hidden = list.length > 0;
      $('[data-empty-msg]', view).textContent = `No posts${label} match “${q}”. Try a broader word like “evals” or “graphs”.`;
    };
    chips.forEach(c => c.addEventListener('click', () => { theme = c.dataset.theme; apply(); }));
    input.addEventListener('input', () => { q = input.value.trim(); apply(); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; q = ''; apply(); } });
    clear.addEventListener('click', () => { input.value = ''; q = ''; apply(); input.focus(); });
    $('[data-reset]', view).addEventListener('click', () => { input.value = ''; q = ''; theme = 'all'; apply(); input.focus(); });
    apply();
  }

  function renderPost(view, [slug], ctx) {
    const p = POST_BY.get(slug);
    if (!p) return false;
    const body = p.bodyHtml ? prepBody(p.bodyHtml) : null;
    const heads = body ? $$('h2', body).map(h => ({ id: h.id, text: h.textContent })) : [];
    const related = POSTS.filter(x => x.slug !== slug)
      .map(x => ({ x, s: x.tags.filter(t => p.tags.includes(t)).length * 10 + x.themes.filter(t => p.themes.includes(t)).length }))
      .sort((a, b) => b.s - a.s || a.x.i - b.x.i).slice(0, 3).map(r => r.x);
    const share = encodeURIComponent(p.url);
    const tocList = heads.map(h => `<li><a href="#${h.id}" data-toc="${h.id}">${esc(h.text)}</a></li>`).join('');
    view.innerHTML = `
    <article class="post">
      <header class="post-head">
        <p class="mono post-meta"><a href="#/blog">Journal</a><span>·</span><time datetime="${p.date}">${p.dateLabel}</time><span>·</span><span>${p.readingMinutes} min read</span></p>
        <h1 class="post-title" tabindex="-1"><span data-hero-title style="display:inline">${esc(p.title)}</span></h1>
        <p class="post-dek">${esc(p.description)}</p>
        <ul class="post-tags mono">${p.tags.map(t => `<li>#${esc(t)}</li>`).join('')}</ul>
      </header>
      <div class="post-layout ${body ? '' : 'nobody'}">
        ${body ? `<aside class="toc" aria-label="Contents"><p class="mono">Contents</p><ol>${tocList}</ol></aside>` : ''}
        <div class="prose post-body">
          ${body ? `<details class="toc-mobile"><summary>Contents · ${heads.length} sections</summary><ol>${tocList}</ol></details>` : ''}
        </div>
        ${body ? '<div class="rail-right" aria-hidden="true"></div>' : ''}
      </div>
      <section class="closing" aria-label="About this post">
        <div class="closing-band">
          <div class="closing-meta">
            <dl class="mono"><dt>Published</dt><dd><time datetime="${p.date}">${p.dateLabel}</time></dd><dt>Reading</dt><dd>${p.readingMinutes} minutes</dd><dt>Filed in</dt><dd>${p.themes.map(t => blogTheme(t).label).join(', ') || 'Notes'}</dd></dl>
            <div class="share">
              <button class="copy-link" type="button" data-copy="${p.url}" data-copy-label="Copy link"><span>Copy link</span><span class="copy-state" aria-hidden="true">${p.url.replace('https://', '')}</span></button>
              <a href="https://twitter.com/intent/tweet?url=${share}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">Share on X ↗</a>
              <a href="https://www.linkedin.com/sharing/share-offsite/?url=${share}" target="_blank" rel="noopener">LinkedIn ↗</a>
            </div>
            <span class="sr-only" aria-live="polite" data-copy-live></span>
          </div>
          <div class="bio">
            <div class="bio-mark"><canvas data-field="bio" aria-hidden="true"></canvas></div>
            <p><strong>Tomas Brasca</strong>Full-stack engineer in Rosario. ICPC South America finalist. Builds web and mobile products, the APIs behind them, and AI systems that make them useful. <a href="#/">See the work</a>.</p>
          </div>
        </div>
        <div class="related">
          <h2>Keep reading</h2>
          <div class="posts-3">${related.map(r => postCard(r)).join('')}</div>
        </div>
      </section>
      <a class="giant-cta" href="#/blog"><span class="par">(</span>all writing <span class="arr">→</span><span class="par">)</span></a>
    </article>`;
    const bodyEl = $('.post-body', view);
    if (body) bodyEl.append(body);
    else {
      bodyEl.insertAdjacentHTML('beforeend', `<div class="offsite">
        <p>${esc(p.description)}</p>
        <p class="note">The full text of this ${p.readingMinutes}-minute post lives on the published site.</p>
        <div><a class="btn" href="${p.url}" target="_blank" rel="noopener">Read it on tomasbrasca.xyz ↗</a></div>
      </div>`);
    }
    paintFields(view, 4);
    if (ctx.morph?.kind === 'post' && ctx.morph.slug === slug) nameEl($('[data-hero-title]', view), `ptitle-${slug}`, 'morph-text');

    const bar = $('#progress');
    bar.classList.add('on');
    const article = $('.post-layout', view);
    const progress = () => {
      const r = article.getBoundingClientRect();
      const total = r.height - innerHeight * 0.6;
      const v = Math.min(1, Math.max(0, (-r.top + innerHeight * 0.3) / Math.max(1, total)));
      bar.style.transform = `scaleX(${v.toFixed(4)})`;
    };
    scrollSubs.add(progress);
    progress();

    let io = null;
    if (heads.length) {
      const links = $$('.toc a', view);
      const seen = new Map();
      io = new IntersectionObserver(entries => {
        entries.forEach(e => seen.set(e.target.id, e.isIntersecting));
        const firstVisible = heads.find(h => seen.get(h.id));
        if (!firstVisible) return;
        links.forEach(a => a.toggleAttribute('aria-current', a.dataset.toc === firstVisible.id));
      }, { rootMargin: `-${60}px 0px -55% 0px` });
      heads.forEach(h => io.observe(document.getElementById(h.id)));
    }
    return () => {
      scrollSubs.delete(progress);
      bar.classList.remove('on');
      bar.style.transform = 'scaleX(0)';
      io?.disconnect();
    };
  }

  function renderNotFound(view, params, ctx) {
    const raw = location.hash.replace(/^#/, '');
    const path = decode(raw) ?? raw;
    view.innerHTML = `
    <section class="nf">
      <div class="nf-plate"><canvas data-field="lost" aria-hidden="true"></canvas></div>
      <div>
        <p class="mono" style="color:var(--muted)">404 · Undeveloped</p>
        ${twoTone('A little', 'off course.', 'h1', 'tabindex="-1"')}
        <p>Nothing was ever exposed at <code>${esc(path)}</code>. This plate will stay a dither.</p>
        <div class="nf-actions"><a class="btn" href="#/">Back home</a><a class="btn line" href="#/blog">Read the journal</a></div>
      </div>
    </section>`;
    const c = $('canvas', view);
    D.paintStatic(c, D.field('field:lost', { glyph: '✳' }), 'field:lost', 12);
  }

  const ROUTES = [
    { name: 'home', re: /^\/?$/, render: renderHome, nav: null, title: () => 'Tomas Brasca. Ideas made useful.' },
    { name: 'work', re: /^\/work\/([^/?#]+)\/?$/, render: renderWork, nav: 'index', title: ([s]) => `${WORK_BY.get(s)?.title}. Tomas Brasca` },
    { name: 'blog', re: /^\/blog\/?$/, render: renderBlog, nav: 'journal', title: () => 'Journal. Tomas Brasca' },
    { name: 'post', re: /^\/blog\/([^/?#]+)\/?$/, render: renderPost, nav: 'journal', title: ([s]) => `${POST_BY.get(s)?.title}. Tomas Brasca` },
  ];
  const NOT_FOUND = { name: 'notFound', render: renderNotFound, nav: null, title: () => 'Not found. Tomas Brasca' };

  function resolve(hash) {
    const path = decode(hash.replace(/^#/, ''));
    if (path == null) return { ...NOT_FOUND, params: [] };
    for (const r of ROUTES) {
      const m = (path || '/').match(r.re);
      if (m) return { ...r, params: m.slice(1) };
    }
    return { ...NOT_FOUND, params: [] };
  }

  /* ---------- Navigation and transitions ---------- */

  let route = null;
  let cleanup = null;
  let first = true;
  let pendingMorph = null;
  let pendingSection = null;
  let homeSection = null;
  let footerActive = false;
  let activeTransition = null;
  const named = new Set();

  function nameEl(el, name, cls) {
    if (!el) return;
    el.style.viewTransitionName = name;
    el.style.viewTransitionClass = cls;
    named.add(el);
  }
  function nameMorph(a, slug, kind) {
    if (!a) return;
    if (kind === 'work') {
      nameEl($('[data-morph-img]', a), `work-${slug}`, 'morph');
      nameEl($('[data-morph-title]', a), `wtitle-${slug}`, 'morph-text');
    } else {
      nameEl($('[data-morph-title]', a), `ptitle-${slug}`, 'morph-text');
    }
  }
  function clearNames() {
    named.forEach(el => { el.style.viewTransitionName = ''; el.style.viewTransitionClass = ''; });
    named.clear();
  }

  function updateNav() {
    const key = footerActive ? 'contact' : route?.name === 'home' ? homeSection : route?.nav;
    $$('.nav [data-nav]').forEach(a => {
      if (a.dataset.nav === key) a.setAttribute('aria-current', route?.nav === key ? 'page' : 'location');
      else a.removeAttribute('aria-current');
    });
  }
  const STRIP = {
    blog: () => window.scrollY > 4,
    post: () => window.scrollY > 4,
    notFound: () => window.scrollY > 4,
    work: () => { const f = $('.wd-figure'); return !!f && f.getBoundingClientRect().bottom < $('#nav').offsetHeight; },
  };
  const updateStrip = () => document.body.classList.toggle('strip-on', !!STRIP[route?.name]?.());
  scrollSubs.add(updateStrip);
  scrollSubs.add(() => {
    const r = $('#contact').getBoundingClientRect();
    const on = r.top < innerHeight * 0.55;
    if (on !== footerActive) { footerActive = on; updateNav(); }
  });

  function mount(next, morph) {
    cleanup?.();
    cleanup = null;
    const view = $('#view');
    view.innerHTML = '';
    view.classList.remove('sheet-in');
    const ctx = { first, morph };
    let out = next.render(view, next.params, ctx);
    if (out === false) {
      next = { ...NOT_FOUND, params: [] };
      view.innerHTML = '';
      out = NOT_FOUND.render(view, [], ctx);
    }
    cleanup = typeof out === 'function' ? out : null;
    route = next;
    document.title = next.title(next.params);
    document.body.classList.toggle('has-bottom-bar', next.name === 'blog');
    fitWords(view);
    const sec = pendingSection;
    pendingSection = null;
    if (sec) {
      const el = document.getElementById(sec);
      window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY - 64 : 0, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    footerActive = false;
    updateNav();
    updateStrip();
    if (first) return;
    const target = (sec && document.getElementById(sec)?.querySelector('h2')) || $('h1[tabindex]', view);
    if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }

  function onRoute() {
    const next = resolve(location.hash);
    let morph = pendingMorph;
    pendingMorph = null;
    if (!morph && route?.name === 'work' && next.name === 'home' && COVER.includes(route.params[0]) && !pendingSection) {
      morph = { kind: 'work', slug: route.params[0] };
      nameEl($('[data-hero-img]'), `work-${morph.slug}`, 'morph');
      nameEl($('[data-hero-title]'), `wtitle-${morph.slug}`, 'morph-text');
    }
    if (first || reducedMQ.matches) {
      clearNames();
      mount(next, null);
      first = false;
      return;
    }
    if (!document.startViewTransition) {
      mount(next, morph);
      void $('#view').offsetWidth;
      $('#view').classList.add('sheet-in');
      clearNames();
      return;
    }
    root.dataset.vt = morph ? 'morph' : 'sheet';
    const t = document.startViewTransition(() => mount(next, morph));
    activeTransition = t;
    t.finished.finally(() => {
      if (activeTransition !== t) return;
      activeTransition = null;
      delete root.dataset.vt;
      clearNames();
    });
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = id === 'contact' ? el.getBoundingClientRect().top + window.scrollY : el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: smooth() });
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const skip = e.target.closest('a.skip');
    if (skip) { e.preventDefault(); $('#view').focus(); return; }
    const sec = e.target.closest('a[data-section]');
    if (sec) {
      e.preventDefault();
      closeMenu(false);
      const id = sec.dataset.section;
      if (id === 'contact' || route?.name === 'home') {
        scrollToId(id);
        const h = document.getElementById(id)?.querySelector('h2');
        if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
        return;
      }
      pendingSection = id;
      location.hash = '#/';
      return;
    }
    const toc = e.target.closest('a[data-toc]');
    if (toc) {
      e.preventDefault();
      const h = document.getElementById(toc.dataset.toc);
      if (h) { window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - 80, behavior: smooth() }); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      return;
    }
    const m = e.target.closest('a[data-morph]');
    if (m && !reducedMQ.matches && document.startViewTransition) {
      clearNames();
      nameMorph(m, m.dataset.slug, m.dataset.morph);
      pendingMorph = { kind: m.dataset.morph, slug: m.dataset.slug, frame: $('[data-plate]', m)?.__plate?.frame || 0 };
    }
    const link = e.target.closest('a[href^="#/"]');
    if (link && link.getAttribute('href') === location.hash) {
      e.preventDefault();
      pendingMorph = null;
      clearNames();
      window.scrollTo({ top: 0, behavior: smooth() });
    }
    if (link && link.closest('#menu')) closeMenu(false);
  });

  addEventListener('hashchange', onRoute);

  /* ---------- Copy buttons ---------- */

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const state = $('.copy-state', btn);
    const live = btn.parentElement.querySelector('[data-copy-live]') || btn.closest('section, footer')?.querySelector('[data-copy-live]');
    const prev = btn.dataset.prev ?? state.textContent;
    btn.dataset.prev = prev;
    const ok = await copyText(btn.dataset.copy);
    btn.classList.toggle('copied', ok);
    state.textContent = ok ? 'Copied ✓' : 'Press ⌘C';
    if (live) live.textContent = ok ? `Copied ${btn.dataset.copy} to the clipboard.` : 'Copy failed. Select the text to copy it.';
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('copied'); state.textContent = prev; if (live) live.textContent = ''; }, 2200);
  });

  /* ---------- Overlays: search and menu ---------- */

  const search = $('#search');
  const sInput = $('#search-input');
  const sGhost = $('#search-ghost');
  const sList = $('#search-results');
  const sCount = $('#search-count');
  let searchTrigger = null;
  let results = [];
  let active = 0;

  const INDEX = [
    ...WORK.map(w => ({ kind: 'Project', title: w.title, sub: w.summary, meta: w.cat, href: `#/work/${w.slug}`, hay: `${w.title} ${w.tags.join(' ')} ${w.summary} ${w.role}`.toLowerCase() })),
    ...POSTS.map(p => ({ kind: 'Writing', title: p.title, sub: p.description, meta: `${p.dateLabel} · ${p.readingMinutes} min`, href: `#/blog/${p.slug}`, hay: `${p.title} ${p.tags.join(' ')} ${p.description}`.toLowerCase() })),
  ];
  const DEFAULTS = [...COVER.map(s => INDEX.find(x => x.href === `#/work/${s}`)), ...INDEX.filter(x => x.kind === 'Writing').slice(0, 3)];

  function runQuery(raw) {
    const q = raw.trim().toLowerCase();
    if (!q) return DEFAULTS;
    return INDEX.map((x, i) => {
      const t = x.title.toLowerCase();
      let s = 0;
      if (t.startsWith(q)) s = 100;
      else if (t.split(/[\s:,.-]+/).some(word => word.startsWith(q))) s = 60;
      else if (t.includes(q)) s = 40;
      else if (x.hay.includes(q)) s = 10;
      return { x, s, i };
    }).filter(r => r.s).sort((a, b) => b.s - a.s || a.i - b.i).map(r => r.x);
  }

  function paintSearch() {
    const raw = sInput.value;
    results = runQuery(raw);
    active = Math.min(active, Math.max(0, results.length - 1));
    const top = results[0];
    const completes = raw && top && top.title.toLowerCase().startsWith(raw.toLowerCase()) && raw.length < top.title.length;
    sGhost.innerHTML = completes ? `<span class="typed">${esc(raw)}</span>${esc(top.title.slice(raw.length))}` : '';
    sList.innerHTML = results.length
      ? results.map((r, i) => `<li role="option" id="sr-${i}" aria-selected="${i === active}"><a href="${r.href}" tabindex="-1"><span class="kind">${r.kind}<br>${esc(r.meta)}</span><span><span class="title">${highlight(r.title, raw.trim())}</span><span class="sub">${esc(r.sub)}</span></span><span class="go">Enter ↵</span></a></li>`).join('')
      : `<li class="search-empty">Nothing for “${esc(raw.trim())}”. Try “sift”, “evals” or “graphs”.</li>`;
    sCount.textContent = raw.trim() ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Selected work and recent writing';
    sInput.setAttribute('aria-activedescendant', results.length ? `sr-${active}` : '');
  }
  function setActive(i) {
    if (!results.length) return;
    active = (i + results.length) % results.length;
    $$('li[role="option"]', sList).forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
    sInput.setAttribute('aria-activedescendant', `sr-${active}`);
    $(`#sr-${active}`)?.scrollIntoView({ block: 'nearest' });
  }
  function openSearch() {
    if (!search.hidden) return;
    closeMenu(false);
    searchTrigger = document.activeElement;
    search.hidden = false;
    search.classList.toggle('open', !reducedMQ.matches);
    document.body.style.overflow = 'hidden';
    sInput.value = '';
    active = 0;
    paintSearch();
    sInput.focus();
  }
  function closeSearch(restore = true) {
    if (search.hidden) return;
    search.hidden = true;
    document.body.style.overflow = '';
    if (restore && searchTrigger && document.contains(searchTrigger)) searchTrigger.focus();
    searchTrigger = null;
  }
  function goResult(i) {
    const r = results[i];
    if (!r) return;
    closeSearch(false);
    if (location.hash === r.href) window.scrollTo({ top: 0, behavior: smooth() });
    else location.hash = r.href;
  }
  $('#search-open').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', () => closeSearch());
  sInput.addEventListener('input', () => { active = 0; paintSearch(); });
  sInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); goResult(active); }
    else if ((e.key === 'Tab' && !e.shiftKey) || (e.key === 'ArrowRight' && sInput.selectionStart === sInput.value.length)) {
      if (sGhost.textContent && results[0]) { e.preventDefault(); sInput.value = results[0].title; active = 0; paintSearch(); }
    }
  });
  sList.addEventListener('click', e => {
    const li = e.target.closest('li[role="option"]');
    if (!li) return;
    e.preventDefault();
    goResult(Number(li.id.slice(3)));
  });
  sList.addEventListener('pointermove', e => {
    const li = e.target.closest('li[role="option"]');
    if (li && hoverMQ.matches) { const i = Number(li.id.slice(3)); if (i !== active) setActive(i); }
  });

  const menu = $('#menu');
  const menuBtn = $('#menu-open');
  function openMenu() {
    menu.hidden = false;
    menu.classList.toggle('open', !reducedMQ.matches);
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    $('#menu-close').focus();
  }
  function closeMenu(restore = true) {
    if (menu.hidden) return;
    menu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (restore) menuBtn.focus();
  }
  menuBtn.addEventListener('click', openMenu);
  $('#menu-close').addEventListener('click', () => closeMenu());

  function trap(e, box) {
    const f = $$('a[href], button:not([hidden]), input', box).filter(el => el.offsetParent !== null && el.tabIndex >= 0);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }

  const typing = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!search.hidden) { e.preventDefault(); closeSearch(); return; }
      if (!menu.hidden) { e.preventDefault(); closeMenu(); return; }
    }
    if (e.key === 'Tab') {
      if (!search.hidden) trap(e, search);
      else if (!menu.hidden) trap(e, menu);
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (search.hidden) openSearch(); else closeSearch();
      return;
    }
    if (e.key === '/' && search.hidden && !typing(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openSearch();
    }
  });

  $('#totop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: smooth() });
    $('#view').focus({ preventScroll: true });
  });

  /* ---------- Boot ---------- */

  $('#year').textContent = new Date().getFullYear();
  COVER.forEach(s => D.load(WORK_BY.get(s).img));
  if (!reducedMQ.matches) {
    root.classList.add('intro');
    setTimeout(() => root.classList.remove('intro'), 2400);
  }
  fitWords(document);
  onRoute();
})();
