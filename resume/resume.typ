// Tomas Brasca — résumé template.
// Content lives in the data block below; layout is the functions after it.
// Edit the data per company (see the blog post's résumé section), keep the
// layout as-is. Compile with: typst compile resume/resume.typ public/cv.pdf

// ---- data -------------------------------------------------------------

#let name = "Tomas Brasca"
#let location = "Rosario, Argentina"
#let links = (
  (label: "LinkedIn", url: "https://www.linkedin.com/in/tomasbrasca"),
  (label: "Github", url: "https://github.com/soundOfff"),
)
#let email = "tomibrasca97@gmail.com"

#let about = "Backend-focused fullstack engineer with 4+ years shipping production systems at YC-backed startups. Proficient in Python and TypeScript, with deep experience designing APIs, building distributed systems, and integrating AI automation workflows that replace manual processes. Comfortable owning problems end-to-end — from architecture to deployment and observability — in fast-moving, high-ownership environments."

#let experience = (
  (
    title: "Software Engineer II",
    location: "United States",
    org: "Dex",
    dates: "2025-Current",
    bullets: (
      "Designed and built a multi-LLM integration architecture (OpenAI, OpenRouter, Groq) handling real-time CRM AI features — balancing latency, cost, and response quality across concurrent workflows.",
      "Built backend services and APIs in Python and Node.js powering AI-driven automation that reduced manual operations work, with observability and monitoring across AWS/Docker deployments.",
      "Delivered full-stack features across web and mobile (Vue 3, React Native, Prisma, PostgreSQL) with end-to-end ownership from spec to production.",
    ),
  ),
  (
    title: "Software Engineer II",
    location: "United States",
    org: "Mint Mobile",
    dates: "2024-2025",
    bullets: (
      "Developed and maintained high-traffic e-commerce services supporting 2–3M mobile subscribers, building REST APIs with PHP, TSOA, and WordPress.",
      "Built custom WordPress plugins that let marketing teams update landing-page content without developer support, shortening time-to-publish.",
      "Maintained a shared React/Next.js component library used across internal and customer-facing apps to improve UI consistency and developer velocity.",
    ),
  ),
  (
    title: "Software Engineer I",
    location: "Argentina",
    org: "Pollux",
    dates: "2022-2024",
    bullets: (
      "Delivered full-stack solutions across multiple client projects using PHP, Next.js, AWS, and Docker, collaborating with 3–4 developers to launch scalable production systems.",
      "Conducted code reviews and mentored junior engineers, improving code quality and onboarding speed.",
    ),
  ),
)

#let skills = "Python, TypeScript, JavaScript, PHP, Node.js, FastAPI, Express, Laravel, REST APIs, GraphQL, PostgreSQL, MySQL, MongoDB, Redis, Prisma, AWS (SQS, SES, SNS, EC2), Docker, Kafka, Next.js, Vue 3, React Native, OpenAI API, multi-LLM orchestration, agent workflows"

#let education = (
  (
    school: "Universidad Tecnologica Nacional De Rosario, Argentina",
    dates: "2019-2024",
    degree: "Information System Engineering",
  ),
)

#let activities = (
  (
    title: "Trading Algorithmic Competition at GTS",
    dates: "2023",
    text: "Won the GTS Trading Algorithmic Competition, building automated trading strategies on simulated historical market data across global currencies. Applied analytical and creative problem-solving in a team setting to improve returns and outperform competing teams.",
  ),
  (
    title: "South America/South Finals at ICPC",
    dates: "2023",
    text: "Placed 17th nationally in the Argentinian Programming Tournament (TAP), qualified for the 2024 ICPC South America Regional Finals, representing Universidad Tecnológica Nacional (UTN), and placed 30th.",
  ),
)

// ---- layout -------------------------------------------------------------

#set page(
  paper: "us-letter",
  margin: (top: 0.45in, bottom: 0.4in, x: 0.75in),
  footer: context [
    #set text(size: 9pt)
    #align(center)[#name]
  ],
)
#set text(font: "New Computer Modern", size: 10.4pt, lang: "en")
#set par(justify: false, leading: 0.55em)

#let section(title) = block(above: 0.65em, below: 0.35em)[
  #text(weight: "bold", size: 11.5pt, tracking: 0.3pt)[#upper(title)]
  #v(-0.5em)
  #line(length: 100%, stroke: 0.6pt + black)
]

#let row(l, r) = grid(
  columns: (1fr, auto),
  align(left)[#l], align(right)[#r],
)

#let job(entry) = block(above: 0.55em, below: 0.25em)[
  #row(strong(entry.title), emph(entry.location))
  #v(-0.35em)
  #row(emph(entry.org), emph(entry.dates))
  #v(-0.15em)
  #for b in entry.bullets [
    #box(width: 1em)[•] #b \
  ]
]

#let edu(entry) = block(above: 0.55em, below: 0.25em)[
  #row(strong(entry.school), emph(entry.dates))
  #v(-0.35em)
  #emph(entry.degree)
]

#let activity(entry) = block(above: 0.55em, below: 0.25em)[
  #row(strong(entry.title), entry.dates)
  #v(-0.3em)
  #entry.text
]

// ---- document -------------------------------------------------------------

#align(center)[
  #text(size: 21pt, weight: "bold")[#name]
  #v(0.1em)
  #text(size: 10pt)[#location]
  #v(0.05em)
  #text(size: 10pt)[
    #for (i, l) in links.enumerate() [
      #if i > 0 [ | ]
      #link(l.url)[#l.label]
    ]
     | #link("mailto:" + email)[#email]
  ]
]

#section("About me")
#about

#section("Experience")
#for e in experience [#job(e)]

#section("Skills")
#strong[Skills:] #skills

#section("Education")
#for e in education [#edu(e)]

#section("Activities")
#for a in activities [#activity(a)]
