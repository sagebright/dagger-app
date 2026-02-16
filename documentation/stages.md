# The Ten Stages of Spellweaving

Each adventure in the Book of Many Paths is woven through a 10-stage ritual. Human and AI are co-casters — the Sage guides, the user decides.

## Mockup Status

States: **DONE** (reviewed and iterated), **ITERATION** (mockup exists, under revision), **MOCKUP** (first draft complete).

| # | Stage | State | Mockup |
|---|-------|-------|--------|
| 1 | Invocation | DONE | `documentation/mockups/invocation-immersive.html` — simplified to single Spark component shown inline (Title removed), fixed footer button |
| 2 | Attunement | DONE | `documentation/mockups/attunement-immersive.html` — unified card/button styling with Binding: confirmed rows use gold-dim background + gold border, fixed footer buttons, contextual "Select [Component]" confirm action |
| 3 | Binding | DONE | `documentation/mockups/binding-immersive.html` — unified button styling, fixed footer placement, gallery cards show inciting incident (not pitch) for upfront decision-making info |
| 4 | Weaving | MOCKUP | `documentation/mockups/weaving-immersive.html` |
| 5 | Inscription | MOCKUP | `documentation/mockups/inscription-immersive.html` |
| 6 | Conjuring | MOCKUP | `documentation/mockups/conjuring-immersive.html` |
| 7 | Summoning | MOCKUP | `documentation/mockups/summoning-immersive.html` |
| 8 | Enchanting | MOCKUP | `documentation/mockups/enchanting-immersive.html` |
| 9 | Scrying | MOCKUP | `documentation/mockups/scrying-immersive.html` |
| 10 | Sealing | MOCKUP | `documentation/mockups/sealing-immersive.html` |

## Documentation Guide

This document captures both **what's in the mockups** and **what isn't**. Each stage follows this structure:

- **Right Panel** — Visual layout, components, and card/state descriptions
- **Chat Flow** — Conversational patterns between Sage and user
- **Workflows** — Interaction details not shown in the static mockup: multi-step flows, transitions, state changes, editability rules, loading states, edge cases
- **Mockup** — Link to the HTML file

When updating a stage, always check for workflow details that go beyond the mockup snapshot. If a workflow detail isn't documented yet, add it to the Workflows section.

---

## 1. Invocation

> *What shape will your adventure take?*

Opening the Book — the user shares their initial vision, ideas, and (optionally) a name for the adventure they intend to cast.

### Right Panel

The panel shows **Spark** inline — no clickable rows, no separate detail panel. The Spark title, question ("What's the seed of your adventure?"), and a dashed placeholder ("Your spark will appear here...") are displayed directly on the main panel. A "Continue to Attunement" button is fixed at the bottom of the panel, disabled until Spark is confirmed.

| Component | Question | Selection | Behavior |
|------|----------|-----------|----------|
| **Spark** | What's the seed of your adventure? | Read-only summary | Populated by the Sage once it distills the user's vision from conversation. Not user-editable. |

### Chat Flow

The Invocation conversation is freeform — no predefined card choices. The Sage opens with an introduction and naming prompt (single combined message), then probes for the user's vision through open-ended questions. The mockup captures a mid-conversation snapshot: the user has shared their premise and the Sage is thinking.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/invocation-immersive.html`

---

## 2. Attunement

> *How should it feel?*

Tuning the spell's frequencies — harmonizing the 8 components that shape the adventure through conversational back-and-forth with the Sage.

### Right Panel

The panel shows a **component summary list** grouped into three categories. Each component row is clickable, opening a choice panel that replaces the summary view. A "Continue to Binding" button sits below the last component, disabled until all 8 components are confirmed.

#### Session

| Component | Question | Selection | Choices |
|------|----------|-----------|---------|
| **Span** | How long is this session? | Single-select | **2-3 Hours** — A tight session, get in, play hard, get out. |
| | | | **3-4 Hours** — The standard session, pacing and depth. |
| | | | **4-5 Hours** — A long session, room for everything. |
| **Scenes** | How many scenes should the adventure have? | Single-select | **3 Scenes** — Quick and punchy, a focused one-shot. |
| | | | **4 Scenes** — Room to breathe, the sweet spot for most sessions. |
| | | | **5 Scenes** — Expansive, more room for subplots and twists. |
| | | | **6 Scenes** — Epic scope, a full day of adventure. |

#### Party

| Component | Question | Selection | Choices |
|------|----------|-----------|---------|
| **Members** | How many players will be at the table? | Single-select | **2 Players** — Intimate duo, every choice carries weight. |
| | | | **3 Players** — A tight-knit trio, nimble and focused. |
| | | | **4 Players** — The classic party, balanced and versatile. |
| | | | **5 Players** — A full company, more chaos, more fun. |
| **Tier** | What tier are the characters? | Single-select | **Tier 1** — Levels 1-4, fresh adventurers finding their footing. |
| | | | **Tier 2** — Levels 5-8, proven heroes with growing renown. |
| | | | **Tier 3** — Levels 9-12, legendary figures shaping the world. |
| | | | **Tier 4** — Levels 13+, mythic power, world-altering stakes. |

#### Essence

| Component | Question | Selection | Choices |
|------|----------|-----------|---------|
| **Tenor** | What kind of tenor should your adventure have? | Single-select | **Grim** — Dark, oppressive, and relentless. The Witcher, Dark Souls. |
| | | | **Serious** — Grounded stakes with moments of levity. Lord of the Rings. |
| | | | **Balanced** — Equal parts drama and fun. Classic D&D session. |
| | | | **Lighthearted** — Fun-first with real stakes underneath. Adventure Time. |
| | | | **Whimsical** — Playful, absurd, and joyful. Discworld energy. |
| **Pillars** | Which pillar should lead — combat, discovery, or social? | Single-select | **Interwoven** — All three pillars share the stage. |
| | | | **Battle-Led** — Fights are the centerpiece. |
| | | | **Discovery-Led** — Discovery drives the story. |
| | | | **Intrigue-Led** — Relationships and intrigue lead. |
| **Chorus** | How populated should this world feel? | Single-select | **Sparse** — A few key figures, lonely roads, meaningful encounters. |
| | | | **Moderate** — A solid cast without overwhelm, enough to fill a tavern. |
| | | | **Rich** — A bustling world, names and faces around every corner. |
| **Threads** | Pick up to 3 threads that resonate with your story. | Multi-select (up to 3) | **Redemption & Sacrifice** — What would you give to make things right? |
| | | | **Identity & Legacy** — Who are you, and what will endure? |
| | | | **Found Family** — Bonds forged by choice, not blood. |
| | | | **Power & Corruption** — What does power cost those who wield it? |
| | | | **Trust & Betrayal** — Who can you believe when it matters most? |
| | | | **Survival & Justice** — When staying alive conflicts with doing right. |

### Chat Flow

(To be documented)

### Workflows

- Component selection uses the same card styling as Binding's frame cards:
  - **Default** — subtle border, clickable
  - **Selected** (in choice panel) — gold-dim background, gold border, gold left-border accent (matches Binding's Active frame card)
  - **Confirmed** (on summary panel) — same gold treatment as Binding's Active frame card: gold-dim background, gold border, gold left-border, gold component name
- Two exit paths from the choice panel (matches Binding pattern):
  - **"Return to Attunement"** — returns to summary with NO selection applied (clears any in-panel selection)
  - **"Select [Component]" button** (fixed at bottom) — confirms selection, returns to summary with component marked Confirmed (gold treatment)
- The "Select [Component]" button is contextual: "Select Tenor", "Select Pillars", "Select Threads", etc.
- The "Select [Component]" button is disabled (faded) until the user picks an option; becomes active on selection
- "Continue to Binding" button is fixed at the bottom of the panel (never scrolls away), disabled until all 8 components are confirmed
- All fixed footer buttons (Continue to Binding, Select [Component]) match Binding's button styling: full-width, `padding: 7px 16px`, `border-radius: 8px`, `font-size: 13px`

### Mockup

`documentation/mockups/attunement-immersive.html`

---

## 3. Binding

> *Which frame holds the story?*

Binding the spell to a foundation — selecting the thematic framework (Frame) that anchors the story. Frames are rich multi-section documents sourced from the unified `daggerheart_frames` table, each including an inciting incident that seeds the adventure.

### Right Panel

Frame Gallery → Frame Detail Panel (Attunement-style cross-fade transition)

**Frame Gallery** (default view):
- Scrollable frame cards from the database
- Each card shows **name + inciting incident** (the adventure's launch event — critical decision-making info visible before clicking into detail)
- Three card states:
  - **Default** — subtle border, shows frame name + inciting incident
  - **Exploring** — white/light border on all sides (clicked, viewing detail panel)
  - **Active** — gold left-border + gold-dim background, gold frame name (frame confirmed via "Select Frame" button)

**Frame Detail Panel** (after clicking a frame):
- Header: "Back to Frames" text link (Attunement pattern) + frame name + pitch (italic)
- Scrollable content area with collapsible detail sections
- Fixed "Select Frame" button at the bottom — always visible, never scrolls away

**Frame Detail Sections** (collapsible accordion, in order):
- Expanded by default (titles shown in gold):
  - **Overview** — world background, factions, core conflict
  - **Inciting Incident** — campaign launch event (critical decision-making info)
- Collapsed by default:
  - **Tone & Feel** — atmospheric qualities (pill row)
  - **Touchstones** — pop culture references (pill row)
  - **Themes** — thematic pillars (pill row)
  - **Distinctions** — what makes this frame unique
  - **Heritage & Classes Guidance** — ancestry and class fit
  - **Player & GM Principles** — conduct guidance
  - **Custom Mechanics** — unique rules for this frame
  - **Session Zero Questions** — preparation topics
  - **Complexity Rating** — how much the frame deviates from core rules

**Styling rules:**
- Expanded section titles are gold. Multiple sections can be expanded (and gold) simultaneously.
- Hovering on label pills turns them gold.

**Interaction model:**
- Two exit paths from the detail panel:
  - **"Back to Frames" link** — returns to gallery with NO frame active (clears exploring state)
  - **"Select Frame" button** (fixed at bottom) — returns to gallery with frame marked Active (gold treatment)
- Continue button: disabled until a frame is Active. Selecting a different frame clears the previous selection.

### Chat Flow

Sage presents available frames. User explores via conversation — Sage describes themes, factions, inciting incidents, and connections to tuned components. When the user clicks a frame, the detail panel provides reference while the Sage can elaborate in conversation. After frame confirmed, Sage acknowledges and invites progression to Weaving.

### Workflows

- Frame detail sections load immediately from database when a frame is clicked
- Users CANNOT edit Frames — they are read-only from the database (but can request custom frames via chat)
- Clicking a different frame after confirming resets the previous selection
- Explicit confirmation via "Select Frame" button — no implicit confirm-on-back
- The "Select Frame" button is fixed at the bottom of the detail panel, visible even when scrolling through dense content
- Active frame card shows gold treatment with name + inciting incident visible

### Schema Migration Plan (Future Dev Task)

The current database has two frame tables:
- `daggerheart_frames` — official frames with minimal fields (id, name, description, themes, typical_adversaries, lore, embedding, source_book)
- `daggerheart_custom_frames` — user-created frames with the full rich schema (title, concept, pitch, tone_feel, themes, complexity_rating, touchstones, overview, heritage_classes, player_principles, gm_principles, distinctions, inciting_incident, custom_mechanics, session_zero_questions)

**Target:** Merge into a single `daggerheart_frames` table using the `daggerheart_custom_frames` schema as the target, plus:
- Add `is_official` boolean flag (or `source` enum: `'official' | 'custom'`)
- Migrate existing official frame data into the rich schema fields (content authoring required)
- Drop the `daggerheart_custom_frames` table after migration
- Update `packages/shared-types/src/database.ts` to reflect the unified schema
- Update `apps/mcp-bridge/src/routes/custom-frames.ts` and `apps/mcp-bridge/src/services/daggerheart-queries.ts` to query the unified table
- Update `apps/web/src/components/content/FramePanel.tsx` to use the unified type

This migration is **not part of the current mockup iteration** — it is documented here for when the Binding stage is implemented as a React component.

### Mockup

`documentation/mockups/binding-immersive.html`

---

## 4. Weaving

> *How does the plot unfold?*

Weaving threads of story into a pattern — drafting 3-6 scene briefs with a feedback loop between Sage and user.

### Right Panel

Scene brief rows (one per scene from Attunement's scene count). Each row shows scene number, title, 1-line brief, and a status badge:
- **Draft** — muted border, muted text
- **Reviewed** — gold outline, gold text
- **Locked** — gold fill, dark text, check icon

"Continue to Inscription" button disabled until all scenes are locked.

### Chat Flow

Sage drafts initial outline based on frame + components. User adjusts scene concepts, reorders, or requests changes. Sage revises. User locks scenes individually as they're approved.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/weaving-immersive.html`

---

## 5. Inscription

> *What unfolds in each scene?*

Inscribing each scene into the Book — draft-feedback-revise cycle per scene, expanding briefs into full scene content.

### Right Panel

Scene selector tabs (Scene 1–Scene N, no "All" option) at top with status: complete (gold fill), active (gold fill), pending (muted). Below, the active scene's content as collapsible sections: Overview, Setup, Developments, NPCs Present, Adversaries, Items & Discoveries, Transitions, GM Notes. Each section has a chevron, name, and status dot (drafted/empty). "Write Scene to File" button below panel content.

### Chat Flow

Per-scene draft-feedback-revise cycle. Sage presents a scene draft, user requests expansions or changes to specific sections. Sage revises. Scene is written to file when all sections are reviewed.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/inscription-immersive.html`

---

## 6. Conjuring

> *Who will the party meet?*

Calling characters into being from the woven story — compiling and enriching NPCs extracted from the scenes.

### Right Panel

Scene selector tabs (All, Scene 1–Scene 4) filter the roster by scene. Two groups: "Key NPCs" and "Minor NPCs". Each NPC card shows initials avatar (gold border when enriched), name, role tag pill, scene badges (muted pill style, "Scene 1" format), and enrichment status (gold check or muted dash). Enriched NPCs get gold left-border treatment. "Continue to Summoning" button is always enabled (enrichment is optional).

### Chat Flow

Sage compiles NPC list from inscribed scenes. User selects NPCs for enrichment — Sage adds backstory, voice, motivation, and secrets. User can enrich as many or few as desired before continuing.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/conjuring-immersive.html`

---

## 7. Summoning

> *What stands in their way?*

Summoning the threats and opposing forces — selecting adversary stat blocks from the `daggerheart_adversaries` Supabase table, matched to tier and scenes.

### Right Panel

Scene selector tabs (All, Scene 1–Scene 4) filter encounters by scene. Tier context pill at top (locked from Attunement). Flat adversary list with inline scene badges on each card (muted pill style, "Scene 1" format). Each adversary card shows name, type badge (color-coded: Bruiser, Skulk, Leader, Solo, Minion), difficulty, compact stat line (HP / Stress / ATK / DMG), and scene badge. Selected adversaries get gold left-border. Social scenes are omitted.

### Chat Flow

Sage recommends adversaries per scene with tactical reasoning. Presents 2-3 options per encounter slot. User picks, Sage confirms and suggests encounter compositions (solo, leader+minions, mixed horde).

### Workflows

(To be documented)

### Mockup

`documentation/mockups/summoning-immersive.html`

---

## 8. Enchanting

> *What treasures await?*

Imbuing objects with power and purpose — choosing tier-appropriate items, weapons, armor, and consumables as rewards.

### Right Panel

Scene selector tabs (All, Scene 1–Scene 4) filter rewards by scene. Category tabs below: Weapons, Armor, Items, Consumables. Active tab shows gold text + gold bottom-border. Each item row shows name, key stat line, scene badge (muted pill style, "Scene 1" format), and gold left-border when assigned. Summary footer shows reward count across scenes. Data sourced from `daggerheart_weapons`, `daggerheart_armor`, `daggerheart_items`, `daggerheart_consumables` tables, filtered by tier.

### Chat Flow

Sage recommends tier-appropriate rewards matched to scenes with narrative reasoning. User approves or swaps items. Each reward tied to a specific scene and discovery context.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/enchanting-immersive.html`

---

## 9. Scrying

> *What might happen at the table?*

Peering into possibilities — GM creativity tools for what could happen at the table across 5 echo categories.

### Right Panel

Scene selector tabs (All, Scene 1–Scene 4) filter echoes by scene. Below, 5 collapsible echo categories per scene: Items & Clues, Environmental Shifts, Social Openings, Magical Effects, Future Threads. Each category header shows chevron, name, and count badge. Expanded categories show echo entries with inline scene badge next to the title (always visible, muted pill style) and trigger/benefit/complication triad (distinct label styling per field).

### Chat Flow

Sage generates echoes per scene. User reviews, requests additions or changes to specific categories. Echoes are player-triggered narrative rewards — the Sage explains the structure and offers creative suggestions.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/scrying-immersive.html`

---

## 10. Sealing

> *Is the spell complete?*

The spell is sealed — the adventure is bound into the Book, ready for export.

### Right Panel

Three sections: (1) Adventure summary card with title, frame, and stat boxes (scenes/NPCs/adversaries/rewards). (2) Completeness checklist — all 10 stages with gold check marks. (3) Export format selector — three cards (Markdown, PDF, JSON) with selected state using gold treatment. Prominent "Seal the Spell" CTA button at bottom (full-width, larger font, gold glow on hover).

### Chat Flow

Sage presents final summary and congratulates the user. Offers last-chance review. User selects export format and seals the spell. Sage provides table-running advice as a warm send-off.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/sealing-immersive.html`
