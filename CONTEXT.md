# Personal Site

Tomas Brasca's portfolio. A site that positions him as a backend engineer who builds the systems behind production AI products, aimed at people deciding whether to hire him.

## Language

**Thesis**:
The one sentence the whole site defends: _"Backend engineer who builds the systems that make AI products work in production."_ Backend is the foundation, AI/LLM systems are the edge, competitive-programming results are the proof. Every section must serve this sentence or be cut.

**Audience**:
The people the site is written for: engineering hiring managers / recruiters (full-time) and founders / CTOs (contract). Treated as one buyer asking one question — _"Can this person own and ship backend systems that survive production?"_
_Avoid_: "users", "visitors" when you specifically mean the people deciding to hire him.

**Case Study**:
A narrative account of one piece of work, structured as problem → architecture → the key tradeoff → outcome. The site has three: Dex (multi-LLM, headline), Mint (2–3M-user scale), and the Flagship. Employer case studies are narrative-only (no proprietary code); the Flagship case study shows real code.
_Avoid_: "project" when you mean a written-up case study.

**Flagship**:
The one personal project built with the most care, doubling as case study #3 and the hero interactive demo: a live multi-LLM router Playground. The on-thesis centerpiece — it lets the Audience experience the exact system the Dex case study describes.

**Playground**:
The live, interactive part of the Flagship: a visitor submits a prompt, it fans out across LLM providers (OpenAI / Groq / OpenRouter), and latency, token cost, and output are shown side by side with a routing decision. Has a cached _demo mode_ (default, free) and a rate-limited _live mode_.

**Blog**:
An actively-maintained writing section (real cadence, not evergreen-only). Four flat, equal, tag-organized pillars: Backend & AI systems, Algorithms & competitive programming, Build logs, and Startup engineering & opinions. The Blog's own index is flat/tag-filtered, but the homepage surfaces technical posts first so the Audience's first impression stays on-Thesis.
_Avoid_: "Writing"/"Notes" as the label — it's a Blog, framed as active.
