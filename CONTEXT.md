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
The one personal project built with the most care, doubling as the hero interactive demo: an A2UI conversational portfolio [[Playground]]. The on-thesis centerpiece — visitors ask natural-language questions about the site owner's work, and an AI agent generates appropriate UI components using Google's A2UI protocol. Demonstrates shipping AI products end-to-end through agent design, custom protocol implementation, and full-stack integration.
_Superseded_: the original Flagship was a live multi-LLM router that let the Audience experience the system described in the Dex case study.

**Playground**:
The live, interactive part of the Flagship: visitors ask questions about portfolio content ("Show me your React projects"), and a Claude-powered agent returns [[A2UI messages]] that the client-side [[A2UI renderer]] converts to UI components (project cards, blog lists, comparison tables, timelines). Backend runs on Cloudflare Workers with a [[portfolio snapshot]] for data context.

**Blog**:
An actively-maintained writing section (real cadence, not evergreen-only). Four flat, equal, tag-organized pillars: Backend & AI systems, Algorithms & competitive programming, Build logs, and Startup engineering & opinions. The Blog's own index is flat/tag-filtered, but the homepage surfaces technical posts first so the Audience's first impression stays on-Thesis.
_Avoid_: "Writing"/"Notes" as the label — it's a Blog, framed as active.

**A2UI message**:
JSON describing UI components the agent wants to render, following Google's A2UI (Agent-to-User Interface) protocol. The Claude-powered agent in the [[Playground]] returns these in response to visitor questions — each message specifies component types (ProjectCard, BlogList, Table, Timeline) and their props. The client-side [[A2UI renderer]] converts them to actual React components.
_Avoid_: "response", "output" when specifically referring to the structured A2UI JSON format.

**A2UI renderer**:
Client-side code (React/Preact) that converts [[A2UI messages]] into actual UI components. Maintains a [[component registry]] (map of component type names to React components), parses the JSON from the agent, and renders the appropriate components with the specified props. Handles incremental updates when the agent modifies existing UI during conversation.
_Note_: Custom-built from scratch — no official A2UI library exists.

**Component registry**:
Map of available component types the agent can generate in [[A2UI messages]]. Keys are type names (e.g., "ProjectCard", "BlogList"), values are the actual React components. The [[A2UI renderer]] looks up components by type name when parsing messages. The agent is constrained to generate only components that exist in this registry.

**Portfolio snapshot**:
Build-time generated JSON containing all content from Astro collections: work projects, blog posts, repos, activity log, principles. One builder module serves both consumers — it is emitted as the static artifact `/data/portfolio.json` (so the pipeline is inspectable from outside), and imported directly by the Cloudflare Worker, which memoizes it per isolate and then TF-IDF-ranks it against the visitor's query before sending it to Claude as context. Cheaper and simpler than embedding full data in every agent call or maintaining a separate database.
_Avoid_: "database", "API" when referring to this static build artifact.
