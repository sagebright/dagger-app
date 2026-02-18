# Sage Codex — Implementation Reboot

## What This Is

This is a full reboot of the dagger-app (Sage Codex). The design is done — 6 completed HTML mockups, a comprehensive design system, and a full behavioral spec. The existing codebase was a functional prototype, but the vision has evolved significantly enough that we need to evaluate whether to salvage or start clean.

Your job is to build the reboot plan. Not to start coding.

## What You Have

### Design (the source of truth)

**Mockups** — 6 active stages, 4 archived reference patterns:

| Stage | Mockup | Status |
|-------|--------|--------|
| 1. Invoking | `documentation/mockups/invoking-immersive.html` | Active |
| 2. Attuning | `documentation/mockups/attuning-immersive.html` | Active |
| 3. Binding | `documentation/mockups/binding-immersive.html` | Active |
| 4. Weaving | `documentation/mockups/weaving-immersive.html` | Active |
| 5. Inscribing | `documentation/mockups/inscribing-immersive.html` | Active |
| 6. Delivering | `documentation/mockups/delivering-immersive.html` | Active |
| — Conjuring | `documentation/mockups/conjuring-immersive.html` | Archived — NPC card pattern reference (absorbed into Inscribing) |
| — Summoning | `documentation/mockups/summoning-immersive.html` | Archived — adversary card + type badge reference (absorbed into Inscribing) |
| — Enchanting | `documentation/mockups/enchanting-immersive.html` | Archived — item card styling reference (absorbed into Inscribing) |
| — Scrying | `documentation/mockups/scrying-immersive.html` | Archived — echo category pattern reference (absorbed into Inscribing) |

Open each active mockup. These are self-contained HTML files with inline CSS — they ARE the design spec.

**Documentation:**

| Document | What It Covers |
|----------|---------------|
| `documentation/reimagine-ui.md` | Design philosophy, color palette, typography, shared components, animation philosophy |
| `documentation/stages.md` | Stage-by-stage panel layouts, section details, workflows, all mockup cross-references |
| `documentation/user-and-system-actions.md` | Dynamic behaviors not visible in mockups: button states, editability rules, LLM-driven panel updates, architectural direction, visual design system, navigation constraints, backend workflows |
| `documentation/llm-capabilities.md` | Technical feasibility assessment: what's easy, what needs careful design, where the real challenges are (context management, latency, state sync, cost) |

Read `documentation/user-and-system-actions.md` first. It's the most complete single reference and includes the color palette, architectural direction, and every user/system action across all 6 stages.

### Existing Codebase

The current app is at `apps/web/` (React/Vite frontend) and `apps/api/` (Express API server). Shared types live in `packages/shared-types/`. The database is Supabase with 14 Daggerheart content tables.

Evaluate what exists against what the mockups and docs describe. Some things may be salvageable (Supabase queries, shared types, Tailwind config, some React components). Make your assessment honestly — don't stretch to reuse code that will fight the new design.

## What's Changing (End to End)

This isn't a UI refresh. It's a full-stack reboot across three layers:

### Architecture
- **Direct Anthropic API integration.** The app calls the Anthropic API directly from the API server using the Anthropic SDK.
- **The LLM drives panel content.** The Sage doesn't just chat — it programmatically updates the right panel (scene arcs, narrative sections, NPC details, etc.) in response to user feedback. This is the most architecturally significant behavior in the app and the hardest to get right. See the "LLM-Driven Panel Content Updates" section in `documentation/user-and-system-actions.md`.

### UI/UX
- **New design system.** Dark mode with gold as the only chromatic color. Lora + Inter typography. The mockups are the spec — not the existing React components.
- **New interaction patterns.** Forward-only progression, scene-by-scene confirmation, 3-wave content generation in Inscribing, cross-fade transitions, fixed footer buttons. All documented in `documentation/user-and-system-actions.md`.

### Database
- **Schema changes needed.** Frame table unification (see `documentation/stages.md` Binding section), `daggerheart_npcs` table (new), generation metadata columns on frames, content review queue support. The existing 14 content tables likely persist.

## How to Approach This

### Phase 1: Evaluate

Read the mockups and documentation. Read the existing codebase. Produce an honest assessment:
- What can be reused as-is?
- What can be adapted?
- What needs to be thrown away?
- What doesn't exist yet and must be built from scratch?

### Phase 2: Plan

Build a phased implementation plan. This is where the real work happens. Consider:

- **Order matters.** What needs to exist before other things can be built? The LLM-to-panel update mechanism is a prerequisite for Weaving and Inscribing. The design system is a prerequisite for all UI work. The Anthropic API integration is a prerequisite for anything that involves the Sage.
- **Phases and subphases.** Break this into digestible chunks. Each phase should be independently verifiable — you can build it, test it, confirm it works before moving on.
- **Don't rush.** The design is done. The intention is to iteratively work through the plan, phase by phase. Quality over speed.
- **Build for the LLM.** The Sage doing heavy lifting (content generation, panel updates, readiness signals, game balance warnings) is not an afterthought — it's the core product. The architecture should serve this, not work around it.

#### LLM Integration: What the Plan Must Address

The Sage is the core of this product. The plan must treat LLM integration as a first-class architectural concern, not something bolted on after the UI is built. Read `documentation/llm-capabilities.md` for the full assessment. Here's what matters for planning:

**What's straightforward** (plan for, but don't over-design):
- Structured panel updates via Anthropic tool use — define tools like `update_section(scene, section, content)` and the LLM calls them alongside chat responses. This is the standard pattern for LLM-driven UIs.
- Content generation (narrative text, NPCs, adversaries, frames, portents) — this is what LLMs do best.
- Readiness signals and button control — just another tool call.
- Frame generation on-the-fly — structured content generation with a defined schema.

**What needs early design decisions** (plan these into early phases):
- **State management.** As the adventure grows (up to 6 scenes x 9 sections), the LLM needs the current panel state on each turn to make targeted updates. The frontend must maintain a structured state object and pass it to the API — not rely on the LLM remembering from conversation history. Design this data model early.
- **Cross-section propagation.** Renaming an NPC must update references across Setup, Developments, and Transitions. A hybrid approach is safer: LLM handles semantic changes, deterministic find-and-replace catches literal string references. Plan for both.
- **Streaming tool call content.** The Anthropic API supports streaming tool call arguments, enabling real-time section rewrites in the panel. This adds frontend complexity — decide early whether to support it or use block swaps.
- **Undo/revision history.** The LLM doesn't maintain this — it's application state. The plan needs a strategy for storing previous section versions so users can ask to "go back."

**What needs strategic planning** (these compound over a session and can't be fixed later):
- **Context window management.** Conversation history + panel state + Daggerheart reference data all compete for tokens. Claude supports 200K tokens, but cost scales with context length. The plan must include a context strategy: summarize earlier turns, compress confirmed scenes, be selective about when to include reference data.
- **Latency.** Generating a full scene draft could take 10-30 seconds. The wave model helps (don't generate all 9 sections at once), and the animation philosophy (thinking pulse, streaming text) helps perceived speed. But the plan should account for generation time in the UX flow.
- **Narrative consistency.** The LLM must maintain consistency across scenes — an NPC from Scene 1 must be coherent in Scene 4. This is prompt engineering + state management. The plan should define what accumulated adventure state gets passed on each turn.
- **Cost.** Each API turn sends the full context. A heavy adventure session might cost $1-5. The architectural decision is to build it as capable as possible first, then optimize if needed — but the plan should make context efficiency a design goal, not an afterthought.

### Phase 3: Iterate

Present the plan. We'll discuss it. Revise it. Lock it down. Then execute phase by phase.

## Principles

- **The mockups are the spec.** If the code doesn't match the mockup, the code is wrong.
- **The actions doc is the behavioral spec.** If a behavior isn't documented there, ask before assuming.
- **Reuse honestly.** Salvage what genuinely fits. Don't force old code into a new shape.
- **Plan the order, not just the work.** A good plan in the wrong sequence is a bad plan.
