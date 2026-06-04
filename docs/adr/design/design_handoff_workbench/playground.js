/* ============================================================
   playground.js — the LLM router demo, shared by all variants.
   Structure-agnostic: it binds to data-attributes so each variant
   can style the panel however it likes.

   Markup contract (inside a [data-pg] container):
     [data-pg-prompt="<id>"]   clickable prompt option (button)
     [data-pg-route]           the amber "Route" action
     [data-pg-mode="demo|live"] segmented mode buttons
     [data-pg-note]            caption shown when live mode is picked
     [data-pg-empty]           shown before first route, hidden after
     [data-pg-result]          result region, revealed after routing
     [data-pg-field="model|provider|latency|cost|why|response|prompt"]
     [data-pg-route-label]     optional text node inside the route button
   ============================================================ */
(function () {
  const FIXTURES = {
    summarize: {
      prompt: 'Summarize this release note in three bullets.',
      model: 'llama-3.1-8b', provider: 'Groq', tone: 'sage',
      latency: '240 ms', cost: '$0.00004',
      why: 'Extractive and short — the smallest model clears the bar.',
      response: '•  Auth tokens now rotate every 24 hours.\n•  Webhook retries are capped at 5 with backoff.\n•  Node 16 is dropped; minimum runtime is Node 18.'
    },
    extract: {
      prompt: 'Pull the order id, total and currency as JSON.',
      model: 'gpt-4o-mini', provider: 'OpenAI', tone: 'blue',
      latency: '410 ms', cost: '$0.00012',
      why: 'Structured output — a mid-tier model with dependable JSON.',
      response: '{\n  "order_id": "A-4471",\n  "total": 128.40,\n  "currency": "EUR"\n}'
    },
    debug: {
      prompt: 'Explain this stack trace and propose a fix.',
      model: 'qwen-2.5-72b', provider: 'OpenRouter', tone: 'clay',
      latency: '980 ms', cost: '$0.00071',
      why: 'Multi-step reasoning — only the large model passes eval.',
      response: 'The null pointer is thrown because `session` is read before `init()` resolves. Await the init promise in the constructor, or guard the getter with `if (!ready) return null`. Root cause: a race between mount and the async config fetch.'
    },
    haiku: {
      prompt: 'Write a haiku about hairlines.',
      model: 'llama-3.1-8b', provider: 'Groq', tone: 'sage',
      latency: '180 ms', cost: '$0.00002',
      why: 'A tiny creative task — the smallest model, no contest.',
      response: 'One pixel, holding —\na page divided by light,\nno shadow needed.'
    }
  };

  function initPanel(root) {
    let current = root.querySelector('[data-pg-prompt].is-active')?.dataset.pgPrompt
      || Object.keys(FIXTURES)[0];
    let mode = 'demo';

    const set = (field, val) => {
      root.querySelectorAll('[data-pg-field="' + field + '"]').forEach(el => { el.textContent = val; });
    };
    const show = (sel, on) => {
      root.querySelectorAll(sel).forEach(el => { el.hidden = !on; });
    };

    function selectPrompt(id) {
      current = id;
      root.querySelectorAll('[data-pg-prompt]').forEach(b => {
        b.classList.toggle('is-active', b.dataset.pgPrompt === id);
      });
      set('prompt', FIXTURES[id].prompt);
    }

    function route() {
      const f = FIXTURES[current];
      const btn = root.querySelector('[data-pg-route]');
      const label = root.querySelector('[data-pg-route-label]');
      const prev = label ? label.textContent : null;
      if (btn) btn.classList.add('is-routing');
      if (label) label.textContent = 'Routing…';
      show('[data-pg-empty]', false);

      setTimeout(() => {
        set('model', f.model);
        set('provider', f.provider);
        set('latency', f.latency);
        set('cost', f.cost);
        set('why', f.why);
        set('response', f.response);
        root.querySelectorAll('[data-pg-modelchip]').forEach(c => {
          c.classList.remove('is-blue', 'is-sage', 'is-clay', 'is-amber');
          c.classList.add('is-' + f.tone);
        });
        show('[data-pg-result]', true);
        if (btn) btn.classList.remove('is-routing');
        if (label) label.textContent = prev || 'Route';
      }, 420);
    }

    root.querySelectorAll('[data-pg-prompt]').forEach(b => {
      b.addEventListener('click', () => { selectPrompt(b.dataset.pgPrompt); });
    });
    const routeBtn = root.querySelector('[data-pg-route]');
    if (routeBtn) routeBtn.addEventListener('click', route);

    root.querySelectorAll('[data-pg-mode]').forEach(b => {
      b.addEventListener('click', () => {
        mode = b.dataset.pgMode;
        root.querySelectorAll('[data-pg-mode]').forEach(x => x.classList.toggle('is-active', x === b));
        show('[data-pg-note]', mode === 'live');
      });
    });

    selectPrompt(current);
  }

  function boot() {
    document.querySelectorAll('[data-pg]').forEach(initPanel);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
