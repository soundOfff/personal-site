// Content extracted from the current personal-site working tree. See current-site.md for provenance and usage.
window.SITE = {
  "person": {
    "name": "Tomas Brasca",
    "role": "Full-stack software engineer",
    "location": "Rosario, Argentina",
    "tagline": "Ideas made useful.",
    "bio": [
      "I’m Tomas. I build thoughtful web and mobile products, the APIs behind them, and AI systems that make them useful.",
      "I’m a full-stack engineer with 5+ years of experience. I like working across the whole product, understanding the problem, building the interface, and making the backend reliable.",
      "My competitive programming background shapes how I approach unfamiliar problems. I was an ICPC South America finalist and took first place in the GTS algorithmic trading competition.",
      "These days I’m especially interested in AI products, developer tools and systems that help people learn."
    ],
    "email": "tomibrasca97@gmail.com",
    "cv": "media/cv.pdf",
    "links": [
      {
        "label": "GitHub",
        "href": "https://github.com/soundOfff"
      },
      {
        "label": "LinkedIn",
        "href": "https://www.linkedin.com/in/tomasbrasca"
      }
    ]
  },
  "nav": [
    {
      "label": "Work",
      "href": "/#work"
    },
    {
      "label": "Index",
      "href": "/#index"
    },
    {
      "label": "Journal",
      "href": "/blog"
    },
    {
      "label": "Contact",
      "href": "#contact"
    }
  ],
  "home": [
    {
      "kind": "hero",
      "title": "Ideas made useful.",
      "summary": "I’m Tomas. I build thoughtful web and mobile products, the APIs behind them, and AI systems that make them useful."
    },
    {
      "id": "work",
      "kind": "work",
      "title": "Products in focus.",
      "summary": "Independent tools for learning, reading, and making."
    },
    {
      "kind": "experience",
      "title": "Built in teams. Shipped in the world.",
      "summary": "Product engineering across customer-facing interfaces, backend systems, and AI workflows."
    },
    {
      "id": "index",
      "kind": "projects",
      "title": "The whole body of work.",
      "summary": "All 13 projects, from product work to smaller experiments. Choose a category to explore."
    },
    {
      "id": "readme",
      "kind": "about",
      "title": "Curious by default. Practical by experience.",
      "summary": "I’m a full-stack engineer with 5+ years of experience. I like working across the whole product, understanding the problem, building the interface, and making the backend reliable."
    },
    {
      "kind": "writing",
      "title": "On the page."
    },
    {
      "id": "playground",
      "kind": "playground",
      "title": "Ask about my work.",
      "summary": "Ask a question and get a response built from cards, comparisons and diagrams."
    }
  ],
  "work": [
    {
      "slug": "mint",
      "title": "Mint Mobile",
      "role": "Full-stack / backend engineering",
      "summary": "E-commerce APIs for a platform with 2–3 million subscribers at the time. Inventory, checkout and services around a WordPress order system.",
      "tags": [
        "Experience",
        "React",
        "WordPress",
        "Postgres",
        "Microservices"
      ],
      "href": "https://www.mintmobile.com/",
      "year": "2024",
      "bodyHtml": "<p>Commerce behind the storefront.</p>\n<p>Professional work</p>\n<p>Brand-inspired cover. My contribution was product and backend engineering; this cover is not a screenshot of work I designed. The detailed case study is a narrative account.</p>\n<h2>What I worked on.</h2>\n<p>The storefront is the visible part. My work sat in the services behind it: inventory, checkout and the APIs around an existing WordPress order system. The challenge was to keep the buying path reliable while working with a core the business already depended on.</p>\n<ul><li>Built e-commerce services around the existing WordPress order ledger.</li><li>Worked across inventory and checkout APIs, Postgres and React storefront components.</li><li>Separated fast browsing from the stricter checks needed when an order is placed.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Browse the catalog</li><li>Validate stock and checkout</li><li>Record the order</li></ol>\n<p><a href=\"https://www.mintmobile.com/\">Visit website</a></p>\n<section data-source=\"/work/mint\"><h2>Mint Mobile: e-commerce APIs</h2><p>Backend work on an e-commerce platform for 2 to 3 million subscribers, including inventory, checkout and services around a WordPress order system.</p><blockquote>\n<p><strong>Narrative only.</strong> Mint is employer work, so this case study is a written account\nwith no proprietary code, and figures are directional rather than exact.</p>\n</blockquote>\n<h3>Problem</h3>\n<p>E-commerce APIs serving a few million users have no quiet hours. Traffic spikes\n(campaign drops, payday weekends, flash promotions) are the normal case, not the\nexception, and the hard part isn't raw throughput. It's staying <strong>correct under\ncontention</strong>: inventory that never oversells, carts that never lose items, checkout\nthat never double-charges, all while the read side absorbs orders of magnitude more\ntraffic than the write side.</p>\n<p>There was a second constraint that shaped everything: <strong>the core order system ran\non WordPress</strong>. It predated the team, the business depended on it daily, and a\nbig-bang rewrite was never on the table.</p>\n<h3>Architecture</h3>\n<p>Rather than fight the WordPress core, we built a <strong>microservices architecture on\ntop of it</strong>. WordPress stayed the system of record for orders; everything\nperformance-critical (catalog, inventory, pricing, checkout orchestration) moved\ninto dedicated services that fronted it, so the legacy core only ever saw clean,\nvalidated, already-throttled traffic. The shape that worked inside that services\nlayer was an aggressive separation of the read and write paths around a single\nPostgres source of truth.</p>\n<ul>\n<li><strong>Reads got cached, writes got queued.</strong> Catalog and pricing, the overwhelming\nmajority of traffic, served from a cache layer in front of Postgres, with\ninvalidation driven by write events rather than TTL guesswork on the hot paths.</li>\n<li><strong>The inventory path stayed boringly transactional.</strong> Stock decrements ran as\nshort, row-level-locked transactions with explicit lock ordering. No clever\ndistributed counters; one database, correct by construction.</li>\n<li><strong>Checkout was made idempotent end to end.</strong> Every order submission carried an\nidempotency key, so a retried request (mobile networks retry constantly) could\nnever create a second order or a second charge.</li>\n<li><strong>The slow stuff left the request path.</strong> Emails, invoices, search indexing, and\nanalytics moved behind queues, keeping the synchronous path down to \"validate,\nreserve, charge, respond\".</li>\n<li><strong>The frontend consumed it all through a React component library we maintain.</strong>\nOne versioned library of storefront components (product cards, cart, checkout\nflows) shared across every surface, so UI stayed consistent and backend services\ncould evolve behind stable component contracts instead of per-page integrations.</li>\n</ul>\n<h3>The key tradeoff</h3>\n<p>Consistency versus latency on the inventory path. Serving stock levels from cache\nmakes product pages fast but lies during a rush; locking rows on every read makes\nthem honest but slow. We split the difference deliberately: <strong>product pages show\ncached, slightly-stale stock; checkout re-validates against the source of truth\ninside the transaction.</strong> A shopper might occasionally see \"in stock\" on an item\nthat sells out seconds later, but nobody ever pays for an item the warehouse\ndoesn't have. Choosing <em>where</em> the staleness is allowed to live, rather than\npretending it away, was the decision the whole system leaned on.</p>\n<h3>Outcome</h3>\n<p>The platform rode its peak campaigns (multiples of baseline traffic) without\noversells and without checkout incidents, and tail latency on the buying path\nstayed flat as traffic grew. The deeper outcome was operational: because\ncorrectness lived in a small, well-locked core, scaling work became cache and queue tuning, routine, low-risk changes,\nrather than surgery on the money path. And the WordPress core never became the\nbottleneck everyone feared: shielded by the services layer, it kept doing the one\njob it was good at, being the order ledger, while everything around it scaled.</p>\n<p>The habit Mint drilled in (find the one path that must never lie, make it small,\nand let everything else be eventually consistent) is the same instinct behind\n<a href=\"/work/flagship\">the playground's blast-radius cap</a>: decide your worst case up front\nand make it structural.</p></section>"
    },
    {
      "slug": "dex",
      "title": "Dex",
      "role": "Software Engineer II",
      "summary": "CRM features across web and mobile, plus multi-model routing with task-specific evals across OpenAI, Groq and OpenRouter.",
      "tags": [
        "Experience",
        "Web",
        "Mobile",
        "Python",
        "LLM routing"
      ],
      "href": "https://getdex.com/",
      "image": "media/dex.webp",
      "year": "2025",
      "bodyHtml": "<p>A little context goes a long way.</p>\n<p>Professional work</p>\n<figure><img src=\"media/dex.webp\" alt=\"Public Dex product image — relationships, reminders and notes.\"><figcaption>Public Dex product image — relationships, reminders and notes.</figcaption></figure>\n<p>Product image from getdex.com, used for product context. It does not imply that I designed every screen shown.</p>\n<h2>What I worked on.</h2>\n<p>Dex is a personal CRM for remembering people and keeping in touch. I worked across the web and mobile product, and helped build AI routing that treats different tasks differently instead of sending every request to the same model.</p>\n<ul><li>Developed CRM features across web and mobile.</li><li>Helped route tasks across OpenAI, Groq and OpenRouter.</li><li>Used task-specific evaluations to decide which model could handle a request.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Understand the task</li><li>Choose a capable model</li><li>Evaluate the result</li></ol>\n<p><a href=\"https://getdex.com/\">Visit website</a></p>\n<section data-source=\"/work/dex\"><h2>Dex: multi-LLM routing</h2><p>I helped build routing across OpenAI, Groq and OpenRouter, with evals to check which model could handle each task.</p><blockquote>\n<p><strong>Narrative only.</strong> Dex is employer work, so this case study is a written account\nwith no proprietary code, and figures are directional rather than exact.</p>\n</blockquote>\n<h3>Problem</h3>\n<p>A product feature was making one model do everything: the biggest, most expensive\ntier, on every request, regardless of how trivial the request was. Latency was uneven\nand the bill scaled linearly with usage, which made the feature hard to justify.</p>\n<h3>Architecture</h3>\n<p>I helped build a <strong>classify-then-dispatch system</strong> in front of three providers. Each incoming\nprompt is classified, then dispatched to the cheapest model that clears that class's\neval bar; harder classes escalate to larger models, with per-provider fallback.</p>\n<ul>\n<li><strong>Classify</strong>: bucket the request (extractive, structured, reasoning, creative).</li>\n<li><strong>Dispatch</strong>: walk a cost-ordered catalog, pick the first model that clears the bar.</li>\n<li><strong>Gate</strong>: every class has an eval contract; nothing ships that the eval doesn't pass.</li>\n</ul>\n<h3>The key tradeoff</h3>\n<p>Routing is only as trustworthy as its evals. A bar set too low ships silent quality\nregressions; set too high, you never realise the savings. The work was less about the\nrouting logic and more about <strong>writing honest evals</strong> for each class, and keeping them green.</p>\n<h3>Outcome</h3>\n<p>The traffic mix did what traffic mixes do: the large majority of requests turned out\nto be extractive or short-form: exactly the classes the smallest models clear. Once\nrouting went in, that majority moved off the top-tier model with <strong>no measurable\nregression on the evals that gate each class</strong>. Inference spend stopped scaling with\nraw usage and started scaling with <em>hard</em> usage, which is a much better line to be\non, and tail latency tightened as a side effect; small models aren't just cheaper,\nthey're faster.</p>\n<p>Just as important: the eval suites turned \"is the small model good enough?\" from a\nrecurring debate into a diff against a dataset. Routing decisions became reviewable.</p>\n<p>The arithmetic behind the decision is written up in\n<a href=\"/blog/routing-beats-scaling\">the cost study</a>, and what \"clears the bar\" had to mean for\nany of it to hold is in <a href=\"/blog/evals-are-contracts\">Evals are contracts</a>.</p></section>"
    },
    {
      "slug": "sift",
      "title": "Sift",
      "role": "Independent product engineering",
      "summary": "A study companion for YouTube. Capture concepts, timestamped frames and diagrams in a local notebook beside the video.",
      "tags": [
        "Product",
        "TypeScript",
        "Chrome extension",
        "AI"
      ],
      "image": "media/sift.png",
      "bodyHtml": "<p>Keep the idea. Keep the moment.</p>\n<p>Working extension</p>\n<figure><img src=\"media/sift.png\" alt=\"01 / Capture — the notebook stays beside the lecture.\"><figcaption>01 / Capture — the notebook stays beside the lecture.</figcaption></figure>\n<figure><img src=\"media/sift-02-web-context.png\" alt=\"02 / Understand — cited web context stays separate from lecture content.\"><figcaption>02 / Understand — cited web context stays separate from lecture content.</figcaption></figure>\n<figure><img src=\"media/sift-03-learning-blocks.png\" alt=\"03 / Study — comparisons, diagrams and other learning blocks.\"><figcaption>03 / Study — comparisons, diagrams and other learning blocks.</figcaption></figure>\n<figure><img src=\"media/sift-04-library.png\" alt=\"04 / Return — browse and search saved notebooks.\"><figcaption>04 / Return — browse and search saved notebooks.</figcaption></figure>\n<p>Screenshots from the extension’s store materials, using a synthetic lecture. Live analysis requires the user’s own OpenRouter key.</p>\n<h2>What I worked on.</h2>\n<p>A lecture moves on before a good note is finished. Sift puts a notebook beside the video: concise concepts, the moment they were explained, selected frames and study blocks. Notes stay in the browser, ready to search or export later.</p>\n<ul><li>Built a Chrome extension that analyses short audio windows and selected video frames.</li><li>Connected concept notes to timestamps and a local IndexedDB notebook.</li><li>Added learning blocks, cited web context, library search and notebook export.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Start capture on a lecture</li><li>Read timestamped concepts</li><li>Review the notebook</li></ol>"
    },
    {
      "slug": "second-brain",
      "title": "Second Brain",
      "role": "Independent system design and implementation",
      "summary": "An agent-maintained wiki and reading queue. Linked ideas, source citations and checks for conflicting claims.",
      "tags": [
        "Open source",
        "Python",
        "TypeScript",
        "Knowledge graphs"
      ],
      "href": "https://github.com/soundOfff/second-brain",
      "bodyHtml": "<p>A knowledge base that can show its sources.</p>\n<p>Open source</p>\n<p>Illustrated workflow cover. Personal notes and source documents are not included in the portfolio demo.</p>\n<h2>What I worked on.</h2>\n<p>Second Brain turns collected sources into a linked wiki that an agent maintains over time. Instead of regenerating an answer from scratch on every question, the synthesis becomes an artifact you can read, navigate and audit.</p>\n<ul><li>Separated immutable sources from agent-maintained concepts, entities, recaps and digests.</li><li>Built capture and feed tools, validation and deterministic cleanup around the agent.</li><li>Made unattended maintenance propose changes through pull requests before they enter the main wiki.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Capture an immutable source</li><li>Synthesize and link concepts</li><li>Review the proposed changes</li></ol>\n<p><a href=\"https://github.com/soundOfff/second-brain\">View source</a></p>"
    },
    {
      "slug": "catcher",
      "title": "Catcher",
      "role": "Independent extension and capture pipeline",
      "summary": "Capture UI components from a web page into a personal library, then adapt them for your own codebase.",
      "tags": [
        "Product",
        "TypeScript",
        "Chrome extension"
      ],
      "image": "media/catcher.jpg",
      "bodyHtml": "<p>From a useful interface to a reusable reference.</p>\n<p>Recorded product demo</p>\n<p>Recorded from the actual extension. The recording shows the capture workflow on a demonstration page and a public website.</p>\n<h2>What I worked on.</h2>\n<p>Catcher starts with a small question: what if a good interface could become a useful reference without a folder full of disconnected screenshots? Select a component in a page, capture its appearance and structure, then return to it in a personal library.</p>\n<ul><li>Built the in-page element picker and capture flow.</li><li>Collected component structure, styles and assets into a local library.</li><li>Added a preview and detail view so a captured component can be inspected and reused as a reference.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Select a component</li><li>Capture it with context</li><li>Inspect it in the library</li></ol>"
    },
    {
      "slug": "focus-quote",
      "title": "FocusQuote",
      "role": "Independent full-stack product",
      "summary": "Save passages from the web, organise quotes in a tag graph and review goal-based focus sessions with optional AI reports.",
      "tags": [
        "Open source",
        "Preact",
        "Effect",
        "Hono",
        "SQLite"
      ],
      "href": "https://github.com/soundOfff/focus-quote",
      "image": "media/focus-quote.png",
      "bodyHtml": "<p>Make what you read part of how you work.</p>\n<p>Open source</p>\n<figure><img src=\"media/focus-quote.png\" alt=\"01 / Workspace — quotes and focus activity in one place.\"><figcaption>01 / Workspace — quotes and focus activity in one place.</figcaption></figure>\n<figure><img src=\"media/focus-quote-quotes-library.png\" alt=\"02 / Library — organise saved passages.\"><figcaption>02 / Library — organise saved passages.</figcaption></figure>\n<figure><img src=\"media/focus-quote-session-report.png\" alt=\"03 / Review — revisit a completed focus session.\"><figcaption>03 / Review — revisit a completed focus session.</figcaption></figure>\n<figure><img src=\"media/focus-quote-active-recall.png\" alt=\"04 / Recall — turn saved ideas into a study prompt.\"><figcaption>04 / Recall — turn saved ideas into a study prompt.</figcaption></figure>\n<p>Screenshots from the project’s own documentation.</p>\n<h2>What I worked on.</h2>\n<p>FocusQuote connects two habits that usually live in different apps: saving useful passages and working toward a specific goal. A browser extension captures quotes; the workspace organises them and brings them into focus sessions and review.</p>\n<ul><li>Built quote capture, a searchable library and a graph of tags.</li><li>Designed goal-based focus sessions and their review flow.</li><li>Connected optional AI session reports and active recall with a Preact, Effect, Hono and SQLite stack.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Save a passage</li><li>Work with a clear goal</li><li>Review and recall</li></ol>\n<p><a href=\"https://github.com/soundOfff/focus-quote\">View source</a></p>"
    },
    {
      "slug": "on-call",
      "title": "On-Call",
      "role": "Full-stack implementation",
      "summary": "Monitoring events become incidents with timelines, escalation policies and on-call rotations.",
      "tags": [
        "Product",
        "React",
        "Django",
        "MongoDB"
      ],
      "bodyHtml": "<p>An alert is the start of a workflow.</p>\n<p>Working local application</p>\n<p>Illustrated product cover. The local application uses a Django API and MongoDB; the portfolio does not connect to an incident workspace.</p>\n<h2>What I worked on.</h2>\n<p>On-Call turns monitoring events into incidents with an owner, a timeline and a path to resolution. The application also handles the less visible coordination: repeated events, escalation deadlines and the person actually on call.</p>\n<ul><li>Built event intake with deduplication so repeated alerts attach to an open incident.</li><li>Implemented acknowledge, assign, escalate, note and resolve actions with an incident timeline.</li><li>Added escalation policies, on-call rotations and temporary schedule overrides in React and Django.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Receive and deduplicate events</li><li>Assign and acknowledge</li><li>Resolve with a timeline</li></ol>"
    },
    {
      "slug": "curation",
      "title": "Curation Archive",
      "role": "Independent data and ML pipeline",
      "summary": "A visual archive ranked by a model trained on my own labels, with source tracking and duplicate detection.",
      "tags": [
        "Product",
        "TypeScript",
        "Python",
        "CLIP"
      ],
      "bodyHtml": "<p>An archive with a point of view.</p>\n<p>Prototype</p>\n<p>Concept cover. The full pipeline needs its scoring service, storage and a trained taste model; no live archive or ranking is claimed here.</p>\n<h2>What I worked on.</h2>\n<p>Curation Archive explores a feed shaped by personal taste rather than a general-purpose recommendation model. Source adapters collect candidates; a small model trained on my labels scores them; a quiet interface gives the selected image the whole screen.</p>\n<ul><li>Built a pipeline from source adapters through deduplication, scoring and publication.</li><li>Used frozen CLIP embeddings with a small trainable taste model.</li><li>Tracked provenance and per-image license evidence, with a review queue for uncertain material.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Collect with provenance</li><li>Score against personal labels</li><li>Curate and publish</li></ol>"
    },
    {
      "slug": "editorial",
      "title": "Editorial UI",
      "role": "Library author",
      "summary": "A published component library and token system for content-first interfaces. Used to build this site.",
      "tags": [
        "Open source",
        "TypeScript",
        "React",
        "CSS"
      ],
      "href": "https://www.npmjs.com/package/editorial-ui",
      "bodyHtml": "<p>A small design system with an editorial bias.</p>\n<p>Published open source</p>\n<p>The portfolio itself uses Editorial UI tokens and styles. Browse the package or source for the implementation.</p>\n<h2>What I worked on.</h2>\n<p>Editorial UI packages the decisions that repeat across content-heavy interfaces: type, paper-like surfaces, thin dividers and a clear primary action. It gives the portfolio and other projects shared primitives instead of repeated one-off styling.</p>\n<ul><li>Created React controls and content components backed by CSS tokens.</li><li>Paired Newsreader for reading with Geist for interface text and JetBrains Mono for labels.</li><li>Published the library and documented components, themes and usage.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Choose shared tokens</li><li>Compose accessible controls</li><li>Keep the reading surface calm</li></ol>\n<p><a href=\"https://www.npmjs.com/package/editorial-ui\">Visit website</a></p>\n<p><a href=\"https://github.com/soundOfff/editorial-ui\">View source</a></p>"
    },
    {
      "slug": "dana",
      "title": "Dana",
      "role": "Product engineering",
      "summary": "AI meeting preparation that gathers context from calendars, email, Slack and the web into a brief.",
      "tags": [
        "Product",
        "AI",
        "Integrations",
        "Web"
      ],
      "href": "https://danahq.com/",
      "image": "media/dana.png",
      "bodyHtml": "<p>Walk into the meeting with context.</p>\n<p>Live product</p>\n<figure><img src=\"media/dana.png\" alt=\"Public Dana meeting brief from the product website.\"><figcaption>Public Dana meeting brief from the product website.</figcaption></figure>\n<p>Public product image from danahq.com. The preview uses the website’s demonstration content, not private calendar or email data.</p>\n<h2>What I worked on.</h2>\n<p>Dana gathers scattered context into a meeting brief: who is attending, relevant history, company information and the conversation ahead. It brings calendar, email, Slack and web context into a preparation flow.</p>\n<ul><li>Worked on a meeting-preparation product that connects context from multiple sources.</li><li>Brought the experience together around a readable brief before a meeting.</li><li>Helped bring Dana from product development to launch.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Connect meeting context</li><li>Gather relevant information</li><li>Read the brief</li></ol>\n<p><a href=\"https://danahq.com/\">Visit website</a></p>"
    },
    {
      "slug": "60-seconds",
      "title": "60 Seconds to Prompt",
      "role": "Independent generative UI experiment",
      "summary": "A prompt-to-UI practice game. Compose an interface from a brief and get feedback from a panel of model judges.",
      "tags": [
        "Experiment",
        "Next.js",
        "React",
        "AI SDK",
        "OpenRouter"
      ],
      "bodyHtml": "<p>How clearly can you describe an interface?</p>\n<p>Single-player prototype</p>\n<figure class=\"embed-placeholder\"><figcaption>Interactive demo: PromptPracticeDemo</figcaption></figure>\n<p>The local interactive demo uses canned model responses. Its score is sample data, not an evaluation of the prompt you type. Multiplayer is not implemented.</p>\n<h2>What I worked on.</h2>\n<p>Read a brief, write a prompt, then watch a model compose an interface from a fixed component library. A panel scores the result against the brief. The implemented scope is single-player practice; competitive matchmaking remains a future direction.</p>\n<ul><li>Built the brief → prompt → streamed interface → scorecard loop.</li><li>Restricted generation to a whitelisted component catalog rather than arbitrary markup.</li><li>Added a deterministic demo mode with sample generation and judge responses, so the flow can run without paid model calls.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Read the brief</li><li>Compose the interface</li><li>Inspect the judge panel</li></ol>"
    },
    {
      "slug": "letterboxd",
      "title": "Letterboxd Story",
      "role": "Independent generative publishing experiment",
      "summary": "Turn a Letterboxd diary into an illustrated PDF story, with SVG scenes and a palette derived from viewing activity.",
      "tags": [
        "Experiment",
        "TypeScript",
        "SVG",
        "PDF",
        "LLMs"
      ],
      "image": "media/letterboxd-scene-1.svg",
      "bodyHtml": "<p>A film diary, told as an illustrated story.</p>\n<p>Rendered sample</p>\n<figure><img src=\"media/letterboxd-scene-1.svg\" alt=\"Scene 01 — actual generated SVG output.\"><figcaption>Scene 01 — actual generated SVG output.</figcaption></figure>\n<figure><img src=\"media/letterboxd-scene-2.svg\" alt=\"Scene 02 — the same palette across a new scene.\"><figcaption>Scene 02 — the same palette across a new scene.</figcaption></figure>\n<figure><img src=\"media/letterboxd-scene-3.svg\" alt=\"Scene 03 — illustration from the rendered booklet.\"><figcaption>Scene 03 — illustration from the rendered booklet.</figcaption></figure>\n<p>Existing generated sample based on the public Letterboxd diary davidehrlich. Generation needs external API keys; viewing this artifact does not.</p>\n<h2>What I worked on.</h2>\n<p>Letterboxd Story turns the last three months of viewing into a six-page illustrated booklet. Viewing patterns inform a shared palette and lighting system; generated SVG scenes stay consistent across the story and remain crisp in the final PDF.</p>\n<ul><li>Built the diary ingestion, film enrichment and narrative pipeline.</li><li>Translated viewing signals into reusable colour and lighting rules.</li><li>Composed sanitised SVG scenes into a print-ready PDF, with intermediate artifacts saved for inspection.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Read the viewing diary</li><li>Build a shared visual language</li><li>Compose the booklet</li></ol>"
    },
    {
      "slug": "a2ui",
      "title": "Conversational portfolio",
      "role": "Independent design and engineering",
      "summary": "Ask about my work and an agent responds with cards, comparisons and diagrams using a validated A2UI component catalog.",
      "tags": [
        "Open source",
        "Astro",
        "React",
        "A2UI",
        "Cloudflare"
      ],
      "href": "https://github.com/soundOfff/personal-site",
      "year": "2026",
      "bodyHtml": "<p>Ask a question. Get an interface.</p>\n<p>Interactive portfolio experiment</p>\n<p>The live playground uses the existing backend configuration. The project showcase stays available without starting a model request.</p>\n<h2>What I worked on.</h2>\n<p>The conversational portfolio lets a visitor ask about my work and receive structured cards, comparisons or diagrams. A validated component catalog controls what can be rendered, while the rest of the site remains a conventional, browsable portfolio.</p>\n<ul><li>Built the Astro portfolio and a React island for the conversational interface.</li><li>Mapped structured model output to a constrained A2UI component catalog.</li><li>Connected the experience to the same project and writing data used by the site.</li></ul>\n<h2>From input to something useful.</h2>\n<ol><li>Ask about the work</li><li>Validate structured output</li><li>Render the relevant components</li></ol>\n<p><a href=\"/#playground\">Open the playground</a></p>\n<p><a href=\"https://github.com/soundOfff/personal-site\">View source</a></p>\n<section data-source=\"/work/flagship\"><h2>The agent on this site</h2><p>A project I built so you can ask about my work and get cards, tables or diagrams in reply. The case study covers the A2UI renderer and Cloudflare backend, with public source code.</p><p>Unlike Dex and Mint, the Flagship is a personal project, so it ships with the real code.\nAsk the agent on the homepage a question about my work and it answers with an interface —\nproject cards, a comparison table, a timeline — composed on the spot rather than picked\nfrom a set of screens somebody drew in advance.</p>\n<h3>Problem</h3>\n<p>A portfolio is a fixed set of pages, and the person reading it has a specific question:\n<em>can this person own an AI product end to end?</em> Every reader takes a different route to\nthat answer, and the site can only guess at one of them.</p>\n<p>The obvious fix is a chatbot, which is worse. A wall of generated prose on a page that\nclaims care about interface work argues against itself. What I wanted was the answer\n<em>rendered</em>: ask about the writing and get the list, ask how two systems differ and get the\ntable.</p>\n<h3>Architecture</h3>\n<p>That is what Google's <strong>A2UI</strong> (agent-to-user-interface) protocol is for: the agent emits\nJSON describing components instead of prose, and the client renders them. There is no\nclient library for it, so all of this is written from scratch — four decisions carry it\n(see the <a href=\"https://github.com/soundOfff/personal-site/tree/main/docs/adr\">ADRs</a>):</p>\n<p><strong>1. One catalog, three consumers.</strong> <code>src/lib/a2ui/catalog.ts</code> declares every component\nthe agent may use, with its props documented for a model to read. That one declaration\ngenerates the catalog section of the system prompt, drives the server-side validator, and\nis type-checked against the React registry at build time. The agent cannot name a\ncomponent that does not exist, and a component cannot exist that the agent was never told\nabout.</p>\n<p><strong>2. Forced tool use, then repair.</strong> The model is pinned to a single tool call, so\n\"answered in prose instead\" is not a failure mode. What comes back is still checked\nagainst the catalog, pruned to the tree reachable from the root, and normalised — list\nprops are lifted into the A2UI data model and replaced with <code>{ path }</code> bindings, which is\nwhat lets a later turn refresh a table without resending the surface:</p>\n<pre><code class=\"language-ts\">// unknown types and props are dropped, not rejected: a bad prop should cost\n// the visitor that detail, never the whole answer\nconst kept = [...reachableFrom(root, byId).values()];\nconst model = liftToDataModel(kept);\n</code></pre>\n<p><strong>3. The content is the context.</strong> A build-time pass over the Astro collections emits a\n<a href=\"/data/portfolio.json\">portfolio snapshot</a> — every case study, post, repo and log entry.\nThe agent is given a TF-IDF-ranked slice of it per question, so it answers about this\nsite's real content and cannot invent a project. Publish a post, and the agent knows about\nit on the next deploy. There is no second index to keep in sync.</p>\n<p><strong>4. Demo by default, live behind a cap.</strong> The island boots into recorded transcripts:\nfree, offline, abuse-proof, interactive before any network call. Live mode posts to a\nCloudflare Worker that holds the key, capped per-IP and globally. The prompt's stable\nhalf — instructions, catalog, tool schema — sits behind a cache breakpoint, so most of\neach request's input is served from Anthropic's prompt cache at a tenth of the price.</p>\n<h3>The key tradeoff</h3>\n<p><strong>Generated UI, from a small model.</strong> The agent runs on Haiku, not the largest model\navailable, and the catalog is fourteen components rather than an open-ended DSL. Both are\nthe same bet, and it is the bet the <a href=\"/work/dex\">Dex case study</a> argues for: constrain the\nproblem until the cheapest thing that can solve it does. A narrow catalog is a worse\ndrawing tool and a far better target for a small model, and a surface that is cheap enough\nto leave switched on for the public beats a better one behind a login.</p>\n<p>The cost of that bet is real. The agent cannot invent a layout it wasn't given, so a\nquestion that wants a shape outside the catalog gets an approximation of it.</p>\n<h3>Outcome</h3>\n<p>A portfolio page that still ships near-zero JavaScript, and answers a question I did not\nanticipate with an interface I did not build. Every turn shows what it cost — model,\nlatency, tokens, cache hits, dollars — and will show you the raw A2UI messages behind it,\nbecause the audience for this page opens dev tools out of habit.\n<a href=\"/#playground\">Ask it something.</a></p></section>"
    }
  ],
  "posts": [
    {
      "slug": "how-to-get-a-job-in-big-2026",
      "title": "Notes from a software engineering job search",
      "date": "2026-07-25",
      "description": "What I practiced, where I applied, and what I learned from a remote job search, including the system design rounds I did not pass.",
      "tags": [
        "career",
        "interviews",
        "job-hunting",
        "ai"
      ],
      "readingMinutes": 11,
      "featured": true
    },
    {
      "slug": "binary-search-on-the-answer",
      "title": "Binary search on the answer",
      "date": "2026-06-12",
      "description": "Binary search can narrow a capacity estimate when the pass criterion is stable and monotone. The difficult part is making a load test satisfy those conditions.",
      "tags": [
        "algorithms",
        "binary-search",
        "capacity-planning",
        "load-testing"
      ],
      "readingMinutes": 4,
      "featured": true
    },
    {
      "slug": "data-structures-typescript-python",
      "title": "Data structures in TypeScript and Python",
      "date": "2026-06-12",
      "description": "A practical map of arrays, queues, heaps, maps, and union-find, with the library differences and complexity traps to watch for in TypeScript and Python.",
      "tags": [
        "data-structures",
        "typescript",
        "python",
        "algorithms",
        "interviews"
      ],
      "readingMinutes": 9,
      "featured": false,
      "bodyHtml": "<p>A data structure is a bet about which operation has to be fast. An array bets on random access. A hash map bets on key lookup. A heap bets that the only element you ever care about is the extreme one. Pick the structure whose bet matches the question your code keeps asking, and the complexity analysis mostly does itself.</p>\n<p>What changes between languages is not the bets; it is which ones the standard library has already placed for you. TypeScript and Python make different choices here, and the differences are exactly where interview code and production code go quietly quadratic. This post is the map I wish I'd had as one page: each structure, the question it answers in O(something good), and the one pattern per structure that does most of the work in practice.</p>\n<h2>The map</h2>\n<table>\n<thead>\n<tr>\n<th>Structure</th>\n<th>Core bet</th>\n<th>Where you've already met it</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Array</td>\n<td>O(1) access by index</td>\n<td>Everywhere</td>\n</tr>\n<tr>\n<td>Stack</td>\n<td>O(1) at one end (LIFO)</td>\n<td>Undo/redo, the call stack</td>\n</tr>\n<tr>\n<td>Queue</td>\n<td>O(1) at both ends (FIFO)</td>\n<td>BFS, task scheduling</td>\n</tr>\n<tr>\n<td>Linked list</td>\n<td>O(1) insert/delete at a known node</td>\n<td>LRU cache internals</td>\n</tr>\n<tr>\n<td>Hash table</td>\n<td>O(1) average key lookup</td>\n<td>Every cache, every index</td>\n</tr>\n<tr>\n<td>Heap</td>\n<td>O(1) peek at min/max</td>\n<td>OS schedulers, Dijkstra</td>\n</tr>\n<tr>\n<td>Graph</td>\n<td>model relationships, traverse in O(V+E)</td>\n<td>Shortest-path anything</td>\n</tr>\n<tr>\n<td>Union-Find</td>\n<td>\"are these connected?\" in ~O(1)</td>\n<td>Clustering, Kruskal's MST</td>\n</tr>\n<tr>\n<td>Balanced BST</td>\n<td>sorted map, O(log n) everything</td>\n<td>Java's TreeMap, C++ std::map</td>\n</tr>\n<tr>\n<td>B-tree family</td>\n<td>sorted keys with high fan-out</td>\n<td>Many database indexes</td>\n</tr>\n<tr>\n<td>Trie</td>\n<td>O(L) prefix lookup</td>\n<td>Every autocomplete box</td>\n</tr>\n<tr>\n<td>Suffix array</td>\n<td>O(m log n) substring search</td>\n<td>Bioinformatics, plagiarism detection</td>\n</tr>\n<tr>\n<td>Segment tree</td>\n<td>O(log n) range query <em>with updates</em></td>\n<td>Time-series rollups</td>\n</tr>\n<tr>\n<td>Bloom filter</td>\n<td>membership test using a fixed set of hashes</td>\n<td>Avoiding unnecessary storage reads</td>\n</tr>\n</tbody>\n</table>\n<p>The last four rows you will rarely implement outside a contest. The value of having them in the table is recognition: when someone asks \"what was the average CPU between 2pm and 4pm?\", you should hear <em>range query over an array</em> and know the answer space before opening an editor.</p>\n<p>One row gets no section below: graphs. Not because they matter less, but because traversal is a toolkit of its own, and BFS, DFS, and Dijkstra deserve more than a paragraph. That's <a href=\"/blog/graph-traversal-typescript-python\">the follow-up post</a>.</p>\n<h2>What the languages actually hand you</h2>\n<p>Here is the asymmetry that shapes everything below. <strong>Python gives you <code>list</code>, <code>dict</code>, <code>set</code>, <code>heapq</code>, and <code>collections.deque</code>. TypeScript gives you <code>Array</code>, <code>Map</code>, and <code>Set</code>, and that's it.</strong> TypeScript has no heap, no deque, no sorted map; neither language has a linked list, trie, union-find, or segment tree. Their general-purpose lists and arrays are dynamic. JavaScript typed arrays and Python's <code>array</code> module also provide typed numeric storage, while <code>memoryview</code> exposes a buffer without copying it. Capacity, copying, and element representation still matter for large workloads.</p>\n<p>Two practical consequences:</p>\n<p><strong>The queue trap.</strong> A queue needs O(1) at both ends. Python's <code>list.pop(0)</code> and TypeScript's <code>Array.shift()</code> are both O(n): every remaining element shifts left. Python has the fix built in:</p>\n<pre><code class=\"language-python\">from collections import deque\n\nqueue = deque([start])\nnode = queue.popleft()   # O(1)\n</code></pre>\n<p>TypeScript does not. For interview-sized inputs, <code>shift()</code> is fine and everyone knows it; for production, you either keep a read-index into a plain array or bring a dependency. The point is to know you are making that trade, not to discover it in a profiler.</p>\n<p><strong>The heap gap.</strong> Python's <code>heapq</code> supplies min-heaps. Python 3.14 also adds public max-heap functions such as <code>heappush_max</code> and <code>heappop_max</code>. Negating numeric priorities remains a useful compatibility technique for older versions. See the <a href=\"https://docs.python.org/3/library/heapq.html\">Python heapq documentation</a>. TypeScript has nothing, and this is the single most common \"wait, really?\" for people arriving from Python or Java. In an interview you say so out loud and write the simplest thing that preserves the interface:</p>\n<pre><code class=\"language-ts\">class SortedPriorityQueue {\n  private heap: number[] = [];\n  push(val: number): void {\n    this.heap.push(val);\n    this.heap.sort((a, b) => a - b); // O(n log n) per push, say it then move on\n  }\n  pop(): number | undefined {\n    return this.heap.shift();\n  }\n  peek(): number | undefined {\n    return this.heap[0];\n  }\n}\n</code></pre>\n<p>That is not a heap. It is a sorted array wearing a heap's interface. Naming the gap and bounding the cost is worth more than reproducing sift-up from memory under a clock.</p>\n<h2>Arrays, and the one pattern that pays rent</h2>\n<p>For everything beyond the basics, the leverage is not in the structure; it is in one pattern per structure that converts an O(n²) instinct into an O(n) solution. For arrays, that pattern is the <strong>prefix sum</strong>: spend O(n) once to build an accumulator, then answer any range-sum question in O(1).</p>\n<pre><code class=\"language-python\">def build_prefix(nums: list[int]) -> list[int]:\n    prefix = [0] * (len(nums) + 1)\n    for i, n in enumerate(nums):\n        prefix[i + 1] = prefix[i] + n\n    return prefix\n\ndef range_sum(prefix: list[int], l: int, r: int) -> int:\n    return prefix[r + 1] - prefix[l]   # sum of [l, r] inclusive, O(1)\n</code></pre>\n<pre><code class=\"language-ts\">function buildPrefix(nums: number[]): number[] {\n  const prefix = new Array(nums.length + 1).fill(0);\n  for (let i = 0; i &#x3C; nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];\n  return prefix;\n}\n\nfunction rangeSum(prefix: number[], l: number, r: number): number {\n  return prefix[r + 1] - prefix[l];\n}\n</code></pre>\n<p>The off-by-one is load-bearing: the extra leading zero is what lets <code>range_sum(prefix, 0, r)</code> work without a special case. Prefix sums are the <em>static</em> answer to range queries; the moment the underlying array needs updates between queries, you have walked into segment-tree territory: same question, harder bet.</p>\n<h2>Stacks: the monotonic trick</h2>\n<p>A stack is a dynamic array you only touch at one end, and both languages do it natively with <code>push</code>/<code>pop</code> (or <code>append</code>/<code>pop</code>), no ceremony. The pattern worth drilling is the <strong>monotonic stack</strong>: for each element, find the next greater (or smaller) element to its right, in O(n) instead of the naive O(n²).</p>\n<pre><code class=\"language-ts\">function nextGreater(nums: number[]): number[] {\n  const result = new Array(nums.length).fill(-1);\n  const stack: number[] = []; // indices of elements still waiting for their answer\n\n  for (let i = 0; i &#x3C; nums.length; i++) {\n    while (stack.length &#x26;&#x26; nums[i] > nums[stack[stack.length - 1]]) {\n      result[stack.pop()!] = nums[i];\n    }\n    stack.push(i);\n  }\n  return result;\n}\n// [2,1,2,4,3] → [4,2,4,-1,-1]\n</code></pre>\n<p>The invariant (the stack always holds indices of a non-increasing run) is what makes the amortized analysis one sentence: every index is pushed once and popped at most once, so the nested-looking loop is O(n). Stock-span, daily-temperatures, largest-rectangle-in-histogram are all this one trick in costume.</p>\n<h2>Hash maps: store the complement, not the search</h2>\n<p>Hash maps are useful when the dominant operation is lookup by key. Python dictionaries typically provide average O(1) access. JavaScript Map guarantees average sublinear access, not a particular hash-table implementation or an O(1) bound, and most \"make it faster\" interview answers are some form of \"put a hash map in front of it.\" The canonical pattern is two-sum: instead of scanning for a partner for each element (O(n²)), record what you've <em>seen</em> and ask whether the current element completes a pair:</p>\n<pre><code class=\"language-python\">def two_sum(nums: list[int], target: int) -> list[int]:\n    seen: dict[int, int] = {}          # value -> index\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n    return []\n</code></pre>\n<p>The generalizable move is the reframe: <em>don't search forward for what you need; remember backward what you've had.</em> Frequency counts, anagram grouping, and memoization are the same move with different keys.</p>\n<h2>The ones you always build from scratch</h2>\n<p>Linked lists, tries, and union-find exist in neither standard library, and that turns out to be fine: each is under twenty lines, and the lines are the same every time. Union-find is the one I'd actually memorize, because it answers a question nothing else answers cheaply: <em>are these two things in the same group?</em>, in O(α(n)) per query. α is the inverse Ackermann function, and α(n) ≤ 4 for any n that fits in hardware, so treat it as constant.</p>\n<pre><code class=\"language-python\">class UnionFind:\n    def __init__(self, n: int):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n\n    def find(self, x: int) -> int:\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])  # path compression\n        return self.parent[x]\n\n    def union(self, x: int, y: int) -> bool:\n        px, py = self.find(x), self.find(y)\n        if px == py:\n            return False\n        if self.rank[px] &#x3C; self.rank[py]:\n            px, py = py, px\n        self.parent[py] = px                            # union by rank\n        if self.rank[px] == self.rank[py]:\n            self.rank[px] += 1\n        return True\n</code></pre>\n<p>Using both optimizations gives the usual inverse-Ackermann amortized bound: path compression flattens the tree as you query it, union by rank keeps it from growing tall in the first place. Connected components, cycle detection in undirected graphs, Kruskal's MST, \"do these accounts belong to the same person\": all union-find, all the same twenty lines.</p>\n<p>Linked lists earn their twenty lines differently: not as a container you'd reach for (O(n) to <em>find</em> anything), but as the only structure with O(1) delete at a known node, which is why the textbook LRU cache is a hash map pointing into a doubly linked list, and why the fast-and-slow-pointer trick (cycle detection, find-the-middle in one pass) keeps showing up.</p>\n<p>The LRU cache is worth thirty extra seconds, because it is the one interview classic that <em>composes</em> two structures: the hash map answers \"do we have this key?\" in O(1), the linked list answers \"which entry is oldest?\" in O(1), and every node is reachable from both. And here is where knowing your standard library's bets pays off twice: JavaScript's <code>Map</code> preserves insertion order. Its internal representation is engine-specific; that order guarantee is enough for the cache below. A full LRU in TypeScript is a dozen lines and no node class:</p>\n<pre><code class=\"language-ts\">class LRUCache&#x3C;K, V> {\n  private map = new Map&#x3C;K, V>();\n  constructor(private capacity: number) {\n    if (!Number.isInteger(capacity) || capacity &#x3C; 0) {\n      throw new RangeError('capacity must be a nonnegative integer');\n    }\n  }\n\n  get(key: K): V | undefined {\n    if (!this.map.has(key)) return undefined;\n    const val = this.map.get(key)!;\n    this.map.delete(key);\n    this.map.set(key, val); // re-insert → now the newest entry\n    return val;\n  }\n\n  put(key: K, val: V): void {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, val);\n    if (this.map.size > this.capacity) {\n      this.map.delete(this.map.keys().next().value!); // first key = oldest\n    }\n  }\n}\n</code></pre>\n<p>Python plays the same trick with <code>collections.OrderedDict</code> (<code>move_to_end</code> on access, <code>popitem(last=False)</code> to evict), and if the cache fronts a pure function, <code>functools.lru_cache</code> is one decorator. The hand-rolled doubly-linked-list version is still worth understanding, because it explains the operations the cache needs, regardless of how a runtime implements them. But reaching for it first is solving a problem your standard library already solved.</p>\n<h2>The ones you only reason about</h2>\n<p>B-Trees and Bloom filters close the table, and the honest advice is: understand them, never implement them. A B+ Tree node is sized to one disk page, so hundreds of keys per node means a million-row index is three or four levels deep: three or four disk reads for any lookup. That explains one reason an appropriate B-tree index can reduce lookup work, and it is worth more in a system-design conversation than any implementation would be. A Bloom filter is the inverse trade: a few kilobits buy you \"this key <em>definitely</em> doesn't exist\", which is how RocksDB and Cassandra skip disk reads for absent keys: false positives possible, false negatives never.</p>\n<p>The pattern across this whole post is the same one: the structure is rarely the hard part. The hard part is hearing the question your code keeps asking (<em>next greater? same group? range with updates? definitely absent?</em>) and recognizing which bet, already placed and paid for, answers it. That recognition reflex is the part of contest training that actually transfers, which is <a href=\"/blog/what-icpc-trains-you-to-see\">its own post</a>. For the JavaScript guarantees behind the cache, see the <a href=\"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map\">Map reference</a>.</p>"
    },
    {
      "slug": "graph-traversal-typescript-python",
      "title": "BFS, DFS, and Dijkstra in TypeScript and Python",
      "date": "2026-06-12",
      "description": "Choose BFS, DFS, or Dijkstra from the question and edge weights. Adjacency-list examples in Python and TypeScript, with the assumptions each algorithm needs.",
      "tags": [
        "graphs",
        "bfs",
        "dfs",
        "dijkstra",
        "typescript",
        "python"
      ],
      "readingMinutes": 6,
      "featured": false
    },
    {
      "slug": "the-unglamorous-middle",
      "title": "The unglamorous middle",
      "date": "2026-06-12",
      "description": "Joining my first startup after years of backend work, learning LLM infrastructure on the job, and finding the work that turns a demo into a product.",
      "tags": [
        "startups",
        "ai-products",
        "career",
        "evals"
      ],
      "readingMinutes": 5,
      "featured": false
    },
    {
      "slug": "routing-beats-scaling",
      "title": "Routing before scaling: the cost arithmetic",
      "date": "2026-05-12",
      "description": "A worked example of inference routing, its classification overhead, and the eval bar that makes a cheaper model a defensible choice.",
      "tags": [
        "routing",
        "llm",
        "cost",
        "evals"
      ],
      "readingMinutes": 6,
      "featured": false
    },
    {
      "slug": "evals-are-contracts",
      "title": "Evals are contracts",
      "date": "2026-04-21",
      "description": "A routing decision needs a quality bar. Versioned datasets, explicit pass criteria, and a consequence for failing make that bar reviewable.",
      "tags": [
        "evals",
        "llm",
        "testing",
        "routing"
      ],
      "readingMinutes": 6,
      "featured": false
    },
    {
      "slug": "static-site-dynamic-demo",
      "title": "Why a static site shows a dynamic demo",
      "date": "2026-04-03",
      "description": "A historical build log of the router demo: prerendered pages, one interactive island, and one server endpoint. The demo changed; the boundary still matters.",
      "tags": [
        "astro",
        "architecture",
        "islands",
        "cloudflare"
      ],
      "readingMinutes": 5,
      "featured": false
    },
    {
      "slug": "rate-limiting-inference",
      "title": "Rate-limiting a public inference endpoint",
      "date": "2026-03-18",
      "description": "What per-IP limits, a shared counter, and request caps can control, and why a KV-backed quota is not a strict spending guarantee.",
      "tags": [
        "rate-limiting",
        "cloudflare",
        "kv",
        "security",
        "edge"
      ],
      "readingMinutes": 4,
      "featured": false
    },
    {
      "slug": "building-editorial-ui",
      "title": "Building editorial-ui: hairlines over shadows",
      "date": "2026-02-10",
      "description": "The constraints behind a small component library, and the packaging work needed to make its CSS and React components usable.",
      "tags": [
        "design-systems",
        "react",
        "css",
        "open-source"
      ],
      "readingMinutes": 5,
      "featured": false,
      "bodyHtml": "<p>The first three hours of every side project were always the same: button radius,\ngrey scale, which font, how much shadow. Then the next project, the same three hours,\nslightly different answers. Those answers rarely made a significant difference. They were\njust decisions, and decisions are expensive even when they don't matter.</p>\n<p>The fix is not better taste. The fix is to make the decisions once, encode them, and\nnever have the conversation again. So I built <strong>editorial-ui</strong>: a React component\nlibrary on npm, designed for an audience of exactly one.</p>\n<h2>A design system for one person</h2>\n<p>A company design system mediates disagreement between people. A personal one\neliminates choice for your future self. That second job is easier and, for a solo\nbuilder, more valuable; the enemy is not inconsistency across a team, it is\nre-litigating the same bikeshed every weekend.</p>\n<p>The trick is that a system this small does not need a token taxonomy or a governance\ndoc. It needs a handful of constraints strict enough that most questions answer\nthemselves. I ended up with four.</p>\n<h2>Four constraints are the whole system</h2>\n<ol>\n<li><strong>One amber action per view.</strong> A single primary call-to-action is visually\ndistinct; everything else is ghost, quiet, or danger.</li>\n<li><strong>Hairlines over shadows.</strong> Dividers are <code>1px solid var(--rule)</code>. Cards sit on the\nsurface plane instead of floating above it.</li>\n<li><strong>Warm paper surfaces.</strong> Backgrounds are warm off-white, never pure white or cool\ngrey.</li>\n<li><strong>Serif for reading, sans for UI.</strong> Newsreader appears at headings and quote\ntitles; Geist handles interface text; JetBrains Mono is reserved for small-caps\nlabels and never touches body copy.</li>\n</ol>\n<p>The constraints live in the token file, not in a style guide nobody reads. This is\nthe top of <code>tokens.css</code>, verbatim:</p>\n<pre><code class=\"language-css\">:root {\n  /* Paper surfaces */\n  --paper: #fbfaf6;\n  --paper-2: #f4f2ec;\n  --paper-3: #ece9df;\n\n  /* Ink */\n  --ink: #1a1814;\n  --ink-2: #3a362f;\n  --muted: #807a6f;\n  --muted-2: #b5aea0;\n\n  /* Hairlines */\n  --rule: #e5e0d5;\n  --rule-2: #d9d3c5;\n\n  /* Amber (one per surface) */\n  --amber: #f2a03c;\n  --amber-deep: #c77a1f;\n  --amber-soft: #fbe6c8;\n}\n</code></pre>\n<p>Note the comment on the amber block. The rule is written where the colour is defined,\nso you cannot reach for <code>--amber</code> without reading it. There is no generic <code>--gray-50</code>\nthrough <code>--gray-900</code> ramp because a ramp is a menu, and menus invite choosing. Three\npapers, two inks, two rules. If a screen needs more than that, it might be getting too complex.</p>\n<p>The fifth rule, implicit in the other four: <strong>no new colours</strong>. Every colour\nreference goes through a variable. Dark mode then becomes a token swap\n(<code>:root[data-theme=\"dark\"]</code> redefines the same names) instead of a second stylesheet.</p>\n<h2>The technical shape</h2>\n<p>React components plus plain CSS files. No Tailwind, no CSS-in-JS, no PostCSS.</p>\n<p>The build is tsup with the CSS passed through untouched:</p>\n<pre><code class=\"language-ts\">// tsup.config.ts\nloader: {\n  '.css': 'copy',\n},\n</code></pre>\n<p>tsup's copy loader does not inline <code>@import</code> lines, so a small post-build script\nflattens <code>styles/index.css</code> into one self-contained bundle. That bundle matters\nbecause the package has a <strong>CSS-only entry</strong>: link\n<code>editorial-ui/styles.css</code> in a plain HTML page and write <code>class=\"btn-amber\"</code>, no\nReact required. The React components are a thin typed layer over those exact class\nnames: <code>Button</code> with <code>variant=\"amber\"</code> renders <code>class=\"btn btn-amber\"</code> and nothing\nelse. From the component source:</p>\n<pre><code class=\"language-tsx\">const classNames = [\n  'btn',\n  variant &#x26;&#x26; `btn-${variant}`,\n  size !== 'md' &#x26;&#x26; `btn-${size}`,\n  block &#x26;&#x26; 'btn-block',\n  disabled &#x26;&#x26; 'is-disabled',\n  className,\n]\n  .filter(Boolean)\n  .join(' ');\n</code></pre>\n<p>Why not Tailwind: Tailwind is a tool for making choices quickly, and the entire point\nof this library is that the choices are already made. Utility classes would hand back\nevery decision I just removed. Why not CSS-in-JS: it adds a runtime, complicates\nserver rendering, and makes the CSS-only entry impossible. Plain CSS files are\ninspectable in devtools exactly as written, diff cleanly against the design\nreference, and will still build in ten years.</p>\n<h2>What \"one amber action\" did to the API</h2>\n<p>The constraint that defines the system is the one the\nlibrary <strong>cannot enforce</strong>. A React component cannot see its siblings across the\ntree; <code>Button</code> has no way to know another amber button exists on the same screen.</p>\n<p>So the API encodes the constraint as friction instead. <code>variant</code> is optional, and the\ndefault is the neutral style:</p>\n<pre><code class=\"language-tsx\">&#x3C;Button variant=\"ghost\" onClick={onCancel}>Cancel&#x3C;/Button>\n&#x3C;Button variant=\"amber\">Save&#x3C;/Button>\n</code></pre>\n<p>You opt <em>in</em> to prominence, never out of it. There is no <code>primary</code> prop that\nhalf the team sets out of habit; the word in the code is the colour on the screen,\nwhich makes a second amber button easy to spot in review. Every compound component\nships the hierarchy pre-built: <code>Modal.Footer</code> examples pair a ghost cancel with one\namber confirm, and the docs never show two ambers together, so copy-paste propagates\nthe rule.</p>\n<p>The honest summary: the type system enforces <em>which</em> variants exist, the docs\nenforce <em>how many</em>, and review enforces the rest. A constraint that lives in\nconvention is weaker than one that lives in the compiler, but it is much stronger\nthan one that lives in nobody's head.</p>\n<h2>Publishing: the boring parts took longest</h2>\n<p>The components were a focused sprint. Making the package consumable took longer than\nwriting it, which I have come to accept as\n<a href=\"/blog/the-unglamorous-middle\">the normal shape of shipping</a>.</p>\n<p>The two lines that absorbed the most debugging are in <code>package.json</code>:</p>\n<pre><code class=\"language-json\">\"sideEffects\": [\"**/*.css\"],\n\"exports\": {\n  \".\":            { \"types\": \"./dist/react/index.d.ts\", \"import\": \"./dist/react/index.js\" },\n  \"./react\":      { \"types\": \"./dist/react/index.d.ts\", \"import\": \"./dist/react/index.js\" },\n  \"./fonts.css\":  \"./dist/styles/fonts.css\",\n  \"./tokens.css\": \"./dist/styles/tokens.css\",\n  \"./styles.css\": \"./dist/styles/index.css\",\n  \"./icons\":      { \"types\": \"./dist/react/icons/index.d.ts\", \"import\": \"./dist/react/icons/index.js\" }\n}\n</code></pre>\n<p>The React entry auto-imports its stylesheet so consumers get styles for free.\nWithout <code>sideEffects</code> declaring the CSS, bundlers tree-shake that import away and\nyou ship unstyled buttons, silently, only in production builds. The exports map\nwent through several rounds too: separate <code>fonts.css</code> and <code>tokens.css</code> entries exist\nso a Next.js app can self-host fonts and skip the Google Fonts import, and a\npost-build script prepends <code>\"use client\"</code> banners so the components survive the App\nRouter. None of this is design. All of it decides whether anyone can actually use\nthe thing.</p>\n<h2>Eating it</h2>\n<p>The quiet default view of this site started from these tokens: the hairlines between sections are\n<code>var(--rule)</code>, the background is <code>var(--paper)</code>, and those rules established the original visual baseline. The site has since added cinematic interpretations, while the <a href=\"/work/flagship\">portfolio agent</a> replaced the router demo. This post records the library decisions; it is not a specification for every current page.</p>\n<p>Constraints beat choices. Four of them turned out to be a whole design system.</p>"
    },
    {
      "slug": "what-icpc-trains-you-to-see",
      "title": "What ICPC trains you to see",
      "date": "2026-01-20",
      "description": "What transferred from competitive programming to production work: stating invariants, checking assumptions, and estimating the worst case before writing code.",
      "tags": [
        "icpc",
        "algorithms",
        "invariants",
        "debugging"
      ],
      "readingMinutes": 6,
      "featured": false,
      "bodyHtml": "<p>I haven't often needed a segment tree in production.</p>\n<p>That is the standard objection to competitive programming as job training, and it is correct as far as it goes. Nobody at work has ever asked me for a suffix automaton. The data structures were never the transferable part. What transferred is a reflex the contest format beats into you: <strong>state the invariant, bound the worst case, and only then write code.</strong></p>\n<p>I competed through university and made the ICPC South America finals. Years later, that reflex is the most-used thing I took from it.</p>\n<h2>What the format actually drills</h2>\n<p>An ICPC contest is five hours, three people, one machine, around a dozen problems. Rejected submissions can add penalty time when a problem is eventually solved, subject to the contest rules. That makes failed attempts expensive, but it does not impose a fixed budget of one wrong answer per problem.</p>\n<p>That penalty structure changes how you work. You cannot debug your way to correctness; the judge gives you one bit of feedback per submission. Strong teams converge on the same loop:</p>\n<ol>\n<li><strong>Read the constraints first.</strong> n ≤ 10^5 and n ≤ 10^18 are different problems wearing the same statement.</li>\n<li><strong>State the invariant.</strong> One sentence that must hold at every step, said out loud to a teammate before anyone touches the keyboard.</li>\n<li><strong>Bound the complexity.</strong> Estimate the work against the input size and time limit. Constants depend on the language, hardware, and operations; a universal operations-per-second budget is not a guarantee.</li>\n<li><strong>Then type.</strong> Typing is the cheapest step and the last one.</li>\n</ol>\n<p>The teams that beat us were rarely faster typists. They simply made fewer mistakes.</p>\n<h2>A worked example</h2>\n<p>Classic problem: longest subarray with sum at most S, elements non-negative, n up to 10^7. The instinct is to start typing two pointers. The trained move is to write the invariant first:</p>\n<blockquote>\n<p>At the end of each iteration, <code>[l, r]</code> is a valid window (sum ≤ S) and <code>l</code> is the smallest left index that makes it valid.</p>\n</blockquote>\n<pre><code class=\"language-cpp\">long long sum = 0;\nint l = 0, best = 0;\nfor (int r = 0; r &#x3C; n; r++) {\n  sum += a[r];                    // extend right\n  while (sum > S) sum -= a[l++];  // restore the invariant\n  best = max(best, r - l + 1);    // window valid, l minimal\n}\n</code></pre>\n<p>Three things fall out of that one sentence, all before the code exists.</p>\n<p><strong>Correctness.</strong> <code>best</code> is a maximum over windows where <code>l</code> is minimal for each <code>r</code>, so no longer valid window was skipped.</p>\n<p><strong>Legality.</strong> The <code>while</code> loop only restores the invariant because the elements are non-negative: shrinking the window can never increase the sum. Put a single negative number in the array and the invariant becomes unmaintainable, and sliding window is the wrong technique entirely. The invariant does not just prove the solution; it tells you when the tool is illegal.</p>\n<p><strong>Complexity.</strong> <code>l</code> and <code>r</code> each move at most n times, so the loop is O(n). 10^7 clears the budget with room.</p>\n<p>None of this is exotic. The point is the ordering: invariant, bound, code. Once that is a reflex, it does not switch off when the contest ends.</p>\n<h2>The same reflex, in production</h2>\n<p><strong>Window math.</strong> The live endpoint on this site runs real LLM calls behind a per-IP rate limit on Cloudflare KV; <a href=\"/blog/rate-limiting-inference\">the full design</a> is its own post. The core of it:</p>\n<pre><code class=\"language-ts\">const window = Math.floor(nowSec / windowSec);\nconst key = `rl:${ip}:${window}`;\n</code></pre>\n<p>Invariant: a key counts requests in exactly one window, and the counter only grows within it. Worst cases, stated before the code was written: a client straddling a window boundary can burst roughly twice the limit, and KV has no atomic increment, so concurrent requests can over-admit. Those are limitations of a soft limiter, not a proven global cost bound. The current implementation has changed; <a href=\"/blog/rate-limiting-inference\">the rate-limit article</a> distinguishes best-effort counters from a strict budget. That is contest analysis verbatim: find the adversarial input, bound the damage, decide whether the bound is acceptable.</p>\n<p><strong>A greedy with a one-line proof.</strong> A simplified model router keeps its catalog ordered by cost and picks like this. This illustrates the routing work at Dex; it is not the current A2UI portfolio agent:</p>\n<pre><code class=\"language-ts\">function pickModel(cls: PromptClass, env: Record&#x3C;string, string | undefined>): CatalogEntry | null {\n  for (const entry of CATALOG) {\n    if (entry.clears.includes(cls) &#x26;&#x26; env[entry.keyName]) return entry;\n  }\n  return null;\n}\n</code></pre>\n<p>Cheapest-first is a greedy, and a greedy is only trustworthy when you can prove its property. Here the proof is one sentence: the catalog is sorted by price, so <strong>the first model that clears the class is the cheapest model that clears it</strong>. The production system I worked on at <a href=\"/work/dex\">Dex</a> runs the same shape across OpenAI, Groq and OpenRouter, and the cost case for it is the subject of <a href=\"/blog/routing-beats-scaling\">routing beats scaling</a>. Being able to state the greedy's property in one line is what made the design easy to defend in review.</p>\n<p><strong>Capacity planning as complexity analysis.</strong> The worst-case bill for a public inference endpoint is requests per window, times windows, times max tokens per request, times the dearest price in the catalog. A token limit can bound an individual call under stated assumptions. Bounding aggregate spend also requires a request cap that cannot be bypassed or over-admitted. The same habit applies when estimating a loop against a time limit: name the worst case before you ship, not after the invoice.</p>\n<h2>What contests do not teach</h2>\n<p>Honesty requires the other column. Contest code is <strong>write-only</strong>: it lives five hours, is read by nobody, and is full of variables named <code>a</code>, <code>cnt</code> and <code>dp</code>. Production code is read-mostly, and the contest teaches you nothing about that.</p>\n<p>It does not teach naming. It does not teach boring code; cleverness scores points in a contest and costs money in a codebase. It does not teach deletion; no judge has ever rewarded removing a feature. And it does not teach the timescale that matters at work: code that has to survive other people, changing requirements and your own forgetting, for years.</p>\n<p>I had to unlearn the compression instinct deliberately. Terse is fast under a clock. Terse is a liability in a repo. What transfers is everything that happens before the code, not the code.</p>\n<h2>Coda: the boring strategy</h2>\n<p>I also won the GTS algo-trading competition, and the win followed the same drill. Most entries optimised the average: maximum expected return per round. Mine was the boring one. I spent most of my time bounding the worst case (sizing positions so that no single bad sequence could knock the strategy out) and accepted a visibly lower mean to get that guarantee.</p>\n<p>The flashier strategies had better averages, right up until the tail showed up. Mine was still standing at the end, which is the only metric the scoreboard counted.</p>\n<p>That is the whole lesson in one contest. State what must stay true. Bound the worst case. Let the average take care of itself.</p>"
    }
  ]
};
