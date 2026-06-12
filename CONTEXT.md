# Personal Site

Tomas Brasca's portfolio. A site that positions him as a full-stack engineer who ships AI products end-to-end, aimed at people deciding whether to hire him.

## Language

**Thesis**:
The one sentence the whole site defends: _"Full-stack engineer who ships AI products end-to-end — web, mobile, and the backend that keeps them alive in production."_ End-to-end building is the foundation, AI/LLM systems are the edge, competitive-programming results are the proof. Every section must serve this sentence or be cut.
_Superseded_: the original Thesis was backend-first ("Backend engineer who builds the systems that make AI products work in production"); it underclaimed real full-stack and mobile breadth.

**Audience**:
The people the site is written for: engineering hiring managers / recruiters (full-time) and founders / CTOs (contract). Treated as one buyer asking one question — _"Can this person own and ship an AI product end-to-end and keep it alive in production?"_ Mobile work is evidence of end-to-end breadth, not a separate funnel — the roles pitched stay AI-product / full-stack.
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
