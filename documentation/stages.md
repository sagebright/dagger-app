# The Six Stages of the Unfolding

Each adventure in the Sage Codex unfolds through 6 stages of collaborative creation. The Sage guides, the human storyteller decides — together, they bring a tale from the Codex into the world.

## Mockup Status

States: **DONE** (reviewed and iterated), **ITERATION** (mockup exists, under revision), **MOCKUP** (first draft complete), **DROPPED** (no longer active).

| # | Stage | State | Mockup |
|---|-------|-------|--------|
| 1 | Invoking | DONE | `documentation/mockups/invoking-immersive.html` — simplified to single Spark component shown inline (Title removed), fixed footer button |
| 2 | Attuning | DONE | `documentation/mockups/attuning-immersive.html` — unified card/button styling with Binding: confirmed rows use gold-dim background + gold border, fixed footer buttons, contextual "Select [Component]" confirm action |
| 3 | Binding | DONE | `documentation/mockups/binding-immersive.html` — unified button styling, fixed footer placement, gallery cards show inciting incident (not pitch) for upfront decision-making info |
| 4 | Weaving | DONE | `documentation/mockups/weaving-immersive.html` — redesigned to mirror Inscribing: scene tabs, full arc content per scene, sequential confirmation, pinned footer, 6-stage dropdown |
| 5 | Inscribing | DONE | `documentation/mockups/inscribing-immersive.html` — full rebuild: three-wave section model (9 sections), gallery↔detail pattern, NPC/adversary/item entity cards, Portents echo drill-in, read-aloud blocks, 6-stage dropdown, three scene tab states, color-coded entity labels, speech bubble speaking icon, gold expanded titles |
| 6 | Delivering | DONE | `documentation/mockups/delivering-immersive.html` — celebration panel: Spark callback, Frame overview, Inciting Incident, narrative send-off, single "Bring This Tale to Life" download button in fixed footer |
| — | Conjuring | DROPPED | Subsumed into Inscribing — NPCs Present section |
| — | Summoning | DROPPED | Subsumed into Inscribing — Adversaries section |
| — | Enchanting | DROPPED | Subsumed into Inscribing — Items section |
| — | Scrying | DROPPED | Subsumed into Inscribing — Portents section (echo categories with drill-in) |

### Absorbed Stages

Stages 6–8 of the original 10-stage design (Conjuring, Summoning, Enchanting) were absorbed into Inscribing. Their panel content now appears as entity sections within each scene:

- **Conjuring** → NPCs Present section (compact cards + NPC detail drill-in)
- **Summoning** → Adversaries section (compact cards + adversary stat block drill-in)
- **Enchanting** → Items section (Enchanting-style item cards with type labels)

Scrying (formerly stage 9 of the original design, stage 6 of the 7-stage design) was also absorbed into Inscribing as a Wave 3 section:

- **Scrying** → Portents section (5 echo categories with detail drill-in per category)

The original mockup files remain as reference for the card/styling patterns reused in Inscribing:
- `documentation/mockups/conjuring-immersive.html` — NPC card pattern reference
- `documentation/mockups/summoning-immersive.html` — adversary card + type badge reference
- `documentation/mockups/enchanting-immersive.html` — item card styling reference
- `documentation/mockups/scrying-immersive.html` — echo category + trigger/benefit/complication pattern reference

## Documentation Guide

This document captures both **what's in the mockups** and **what isn't**. Each stage follows this structure:

- **Right Panel** — Visual layout, components, and card/state descriptions
- **Chat Flow** — Conversational patterns between Sage and user
- **Workflows** — Interaction details not shown in the static mockup: multi-step flows, transitions, state changes, editability rules, loading states, edge cases
- **Mockup** — Link to the HTML file

When updating a stage, always check for workflow details that go beyond the mockup snapshot. If a workflow detail isn't documented yet, add it to the Workflows section.

---

## 1. Invoking

> *What shape will your adventure take?*

Opening the Codex — the user shares their initial vision, ideas, and (optionally) a name for the adventure that will unfold.

### Right Panel

The panel shows **Spark** inline — no clickable rows, no separate detail panel. The Spark title, question ("What's the seed of your adventure?"), and a dashed placeholder ("Your spark will appear here...") are displayed directly on the main panel. A "Continue to Attuning" button is fixed at the bottom of the panel, disabled until Spark is confirmed.

| Component | Question | Selection | Behavior |
|------|----------|-----------|----------|
| **Spark** | What's the seed of your adventure? | Read-only summary | Populated by the Sage once it distills the user's vision from conversation. Not user-editable. |

### Chat Flow

The Invoking conversation is freeform — no predefined card choices. The Sage opens with an introduction and naming prompt (single combined message), then probes for the user's vision through open-ended questions. The mockup captures a mid-conversation snapshot: the user has shared their premise and the Sage is thinking.

### Workflows

(To be documented)

### Mockup

`documentation/mockups/invoking-immersive.html`

---

## 2. Attuning

> *How should it feel?*

Sensing the tale's character — harmonizing the 8 components that shape the adventure through conversational back-and-forth with the Sage.

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
  - **"Return to Attuning"** — returns to summary with NO selection applied (clears any in-panel selection)
  - **"Select [Component]" button** (fixed at bottom) — confirms selection, returns to summary with component marked Confirmed (gold treatment)
- The "Select [Component]" button is contextual: "Select Tenor", "Select Pillars", "Select Threads", etc.
- The "Select [Component]" button is disabled (faded) until the user picks an option; becomes active on selection
- "Continue to Binding" button is fixed at the bottom of the panel (never scrolls away), disabled until all 8 components are confirmed
- All fixed footer buttons (Continue to Binding, Select [Component]) match Binding's button styling: full-width, `padding: 7px 16px`, `border-radius: 8px`, `font-size: 13px`

### Mockup

`documentation/mockups/attuning-immersive.html`

---

## 3. Binding

> *Which frame holds the story?*

Anchoring the tale to its foundation — selecting the thematic framework (Frame) that grounds the story. Frames are rich multi-section documents sourced from the unified `daggerheart_frames` table, each including an inciting incident that seeds the adventure.

### Right Panel

Frame Gallery → Frame Detail Panel (Attuning-style cross-fade transition)

**Frame Gallery** (default view):
- Scrollable frame cards from the database
- Each card shows **name + inciting incident** (the adventure's launch event — critical decision-making info visible before clicking into detail)
- Three card states:
  - **Default** — subtle border, shows frame name + inciting incident
  - **Exploring** — white/light border on all sides (clicked, viewing detail panel)
  - **Active** — gold left-border + gold-dim background, gold frame name (frame confirmed via "Select Frame" button)

**Frame Detail Panel** (after clicking a frame):
- Header: "Back to Frames" text link (Attuning pattern) + frame name + pitch (italic)
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
- Update `apps/api/src/services/daggerheart-queries.ts` to query the unified table
- Update `apps/web/src/components/content/FramePanel.tsx` to use the unified type

This migration is **not part of the current mockup iteration** — it is documented here for when the Binding stage is implemented as a React component.

### Mockup

`documentation/mockups/binding-immersive.html`

---

## 4. Weaving

> *How does the plot unfold?*

Weaving threads of story into a pattern — drafting a scene-by-scene arc through a conversational feedback loop between Sage and user. Mirrors Inscribing's scene-tab structure: same spatial model, lighter content.

### Right Panel

#### Scene Tabs

Horizontal numbered tabs (Scene 1, Scene 2, ...) matching Inscribing's scene selector. Sequential flow — Scene 1 is active first. Each confirmation locks the scene and advances to the next.

Three tab states (matching Inscribing):

| State | Visual | Meaning |
|-------|--------|---------|
| **Active** | Gold fill background, dark text (`--accent-gold` bg, `--bg-primary` text, `font-weight: 600`) | Currently being woven — this is where the action is |
| **Confirmed** | Gold-dim wash background, secondary text (`--accent-gold-dim` bg, `--text-secondary` text) | Sealed, locked — done, not interactive |
| **Inactive** | Surface background, secondary text (`--bg-surface` bg, `--text-secondary` text) | Not yet reachable — upcoming scenes |

#### Scene Arc Content

Below the tabs, the full scene arc for the active scene. Lighter than Inscribing's 9-section accordion — just the narrative outline:

- **Scene title** (16px serif header, weight 600)
- **Scene subtitle** (12px, muted — "Scene N of N")
- **Full arc description** (14px, `--text-secondary`, 1.65 line-height) — multiple paragraphs describing what happens, key beats, choices, and how the scene connects to the next

The conversation drives content; the panel reflects the result. The Sage updates the arc text as the user provides feedback.

#### Fixed Footer

Footer button fixed at bottom of panel (never scrolls away), matching Inscribing's `.panel-footer` pattern:
- Scenes 1 through N-1: **"Confirm Scene Summary"** — confirms the current scene and advances to the next
- Final scene (Scene N): **"Continue to Inscribing"** — activates when the user confirms the last scene is good in chat; confirms the final scene and advances to Inscribing
- Button is disabled until the Sage signals readiness in conversation

### Chat Flow

Sage drafts initial outline based on frame + components and populates all scene arcs in the panel. User reviews Scene 1 first — adjusts concepts, requests changes, reorders beats. Sage revises the arc. When the Sage determines a scene is ready, the "Confirm Scene Summary" button enables. User clicks to confirm and advance.

The conversation is scene-focused: while Scene 1 is active, the dialogue centers on Scene 1's arc. Once confirmed, the conversation shifts to Scene 2. The user can reference other scenes in conversation, but only the active scene's arc is editable.

### Workflows

- Scene tab states match Inscribing exactly — same CSS classes (`.scene-selector-tab.active`, `.confirmed`, `.inactive`)
- Panel view pattern matches Inscribing — `.panel-view` divs, one per scene, only the active scene visible
- Sequential flow: Scene 1 unlocked first. Each "Confirm Scene Summary" click locks the current scene (tab → confirmed state) and activates the next (tab → active state)
- The Sage determines when a scene is ready and signals it conversationally. The footer button is disabled until the Sage triggers readiness
- For the final scene, the footer button label changes to "Continue to Inscribing" — this is the only scene where confirmation also advances the stage
- Users can request scene reordering through conversation ("swap Scenes 2 and 3") — the Sage handles the restructuring
- If the user wants to revisit a confirmed scene's content, they can discuss it in chat, but the panel shows it as locked. Major changes would require the Sage to propose unlocking

### Mockup

`documentation/mockups/weaving-immersive.html`

---

## 5. Inscribing

> *What unfolds in each scene?*

The most content-dense stage — inscribing each scene into the Codex through a draft-feedback-revise cycle with the Sage. Inscribing absorbs the work formerly done in Conjuring (NPCs), Summoning (adversaries), Enchanting (items), and Scrying (echoes), managing all scene content through 9 sections organized in three progressive waves.

### Right Panel

#### Scene Tabs

Horizontal numbered tabs (Scene 1, Scene 2, ...) provide spatial orientation across the full arc. Sequential flow — users progress through scenes in order. Once a scene is confirmed, the user moves to the next scene and cannot return.

Three tab states:

| State | Visual | Meaning |
|-------|--------|---------|
| **Active** | Gold fill background, dark text (`--accent-gold` bg, `--bg-primary` text, `font-weight: 600`) | Currently being inscribed — this is where the action is |
| **Confirmed** | Gold-dim wash background, secondary text (`--accent-gold-dim` bg, `--text-secondary` text) | Sealed, resting — done, not interactive |
| **Inactive** | Surface background, secondary text (`--bg-surface` bg, `--text-secondary` text) | Not yet reachable — upcoming scenes |

Visual hierarchy: Active (highest weight) > Confirmed (medium, warm) > Inactive (lowest, neutral).

#### Section Accordion (default view)

The panel shows a collapsible accordion with all 9 sections per scene. Each section header contains:
- **Chevron** (expand/collapse toggle)
- **Section name** (clickable on narrative sections — opens detail card)
- **Speaking icon** (on Setup, Developments, Transitions — indicates read-aloud content behind click-through)

No status dots — the flow is conversational, not checkbox-driven.

When collapsed, narrative sections (Overview, Setup, Developments) show a **metadata preview line** (italic, muted) for orientation without expansion — e.g., "Location: Wickling Hollow — Mood: Tense, wary". Entity sections (NPCs Present, Adversaries, Items) show only the section name when collapsed — no preview text.

#### Sections Per Scene

| # | Section | View Pattern | Detail Card? | Read-Aloud? | Wave |
|---|---------|-------------|-------------|-------------|------|
| 1 | Overview | Accordion-only | No | No | 1 |
| 2 | Setup | Accordion + Detail card | Yes | Yes | 1 |
| 3 | Developments | Accordion + Detail card | Yes | Yes | 1 |
| 4 | NPCs Present | Accordion → Entity list → Drill-in | Yes (per NPC) | No | 2 |
| 5 | Adversaries | Accordion → Entity list → Drill-in | Yes (per adversary) | No | 2 |
| 6 | Items | Accordion → Item cards | No | No | 2 |
| 7 | Transitions | Accordion + Detail card | Yes | Yes | 3 |
| 8 | Portents | Accordion → Category list → Drill-in | Yes (per category) | No | 3 |
| 9 | GM Notes | Accordion-only | No | No | 3 |

#### Section Interaction Patterns

Three distinct patterns depending on section type:

**Narrative sections (Setup, Developments, Transitions):**
- Accordion collapsed: metadata preview line
- Accordion expanded: descriptive text (no read-aloud)
- Click section name → **Detail card**: Full text + read-aloud blocks (cross-fades in, replacing accordion)

**Accordion-only sections (Overview, GM Notes):**
- Accordion collapsed: metadata preview line
- Accordion expanded: full content inline (short enough to not need a detail card)
- No click-through

**Entity sections (NPCs Present, Adversaries):**
- Accordion collapsed: bare section name + chevron (no preview text)
- Accordion expanded: Compact entity cards (name + description sentence). No avatars or initials — just text. Adversary cards also show type badge pill and difficulty level.
- Click a specific entity → **Entity detail card**: Full treatment for that one entity. "Back to Scene" returns to accordion.

**Items:**
- Accordion collapsed: bare section name + chevron (no preview text)
- Accordion expanded: Enchanting-style item cards with type labels (weapon/armor/item/consumable) and a short description. No click-through.

**Portents (echo categories):**
- Accordion collapsed: bare section name + chevron (no preview text)
- Accordion expanded: 5 echo category rows (Items & Clues, Environmental Shifts, Social Openings, Magical Effects, Future Threads). Each row shows category name + count badge.
- Click a category → **Category detail card**: Echo entries for that category with trigger/benefit/complication triads. "Back to Scene" returns to accordion.

#### Section Detail Card (narrative sections)

Cross-fades in when section name is clicked, replacing the accordion. Shows:
- "Back to Scene" link at top (matches Binding's "Back to Frames")
- Section name as header + scene subtitle
- Full content with proper typography
- **Read-aloud text blocks** with distinct styling:
  - Left gold border accent (3px `--accent-gold`)
  - `--accent-gold-dim` background wash
  - Serif italic font (`--font-serif`, `font-style: italic`)
  - Small "READ ALOUD" label above the block (muted, 11px, uppercase)

Read-aloud text appears **only in detail cards** — never in the accordion preview.

#### Speaking Icon (Read-Aloud Indicator)

Sections that contain read-aloud text show a small speech bubble icon (message outline) next to the section name in the accordion. Signals "click through for read-aloud content" without cluttering the preview. Styled in `--text-muted`, turning gold on hover.

Applies to: Setup, Developments, Transitions.

#### NPC Detail Card

Full NPC treatment (LLM-generated — no database table yet, see GH issue below):

| Field | Description |
|-------|-------------|
| Name | NPC name with initials avatar (gold border in detail view) |
| Role | Leader, Antagonist, Oracle, Scout, Minor, etc. (role tag pill) |
| Description | Physical appearance, distinguishing features |
| Backstory | Background, history, how they connect to events |
| Voice & Mannerisms | Speech patterns, verbal tics, physical habits |
| Motivation | What drives them, what they want |
| Secret | Hidden knowledge, betrayal potential, leverage |

#### Adversary Detail Card

Full adversary stat block (from `daggerheart_adversaries` table):

| Field | Description |
|-------|-------------|
| Name | Adversary name |
| Type badge | Bruiser / Minion / Leader / Solo (color-coded pills) |
| Difficulty + Tier | Numeric difficulty and tier level |
| Description | Physical description, behavior |
| Stat block | HP, Stress, ATK, Weapon, Range, DMG (grid layout) |
| Motives & Tactics | Combat behavior and strategic approach |
| Features | Special abilities (list with name + description) |
| Thresholds | Minor / Major / Severe damage thresholds |

Type badge colors: Bruiser `#e07c5a`, Minion `#8b9dc3`, Leader `#c98bdb`, Solo `#db6b6b`.

#### Portents Category Detail Card

Full echo category treatment (absorbed from Scrying stage). Each category shows its echo entries with the trigger/benefit/complication structure:

| Field | Description |
|-------|-------------|
| Echo title | Name of the echo moment (gold, serif, 14px weight 600) |
| Trigger | What the players might do (white label) |
| Benefit | The reward for engaging (white label) |
| Complication | The twist that keeps things interesting (white label) |

No scene badges on echo titles — Portents are already scoped to a scene via the scene tabs. Category names turn gold when expanded, matching other accordion title behavior.

Five categories: Items & Clues, Environmental Shifts, Social Openings, Magical Effects, Future Threads. Styling reuses patterns from the Scrying mockup (`.echo-category`, `.echo-entry`, `.echo-field-label`).

#### Navigation Depth

| Level | What | Example |
|-------|------|---------|
| 1 | Scene tabs | Scene 1, Scene 2, ... |
| 2 | Section accordion | Overview, Setup, NPCs Present, Portents, ... |
| 3a | Narrative detail card | Setup with full text + read-aloud |
| 3b | Entity list (expanded accordion) | NPC name + role cards |
| 3c | Category list (expanded accordion) | Portents echo category rows with counts |
| 4a | Entity detail card | Single NPC full treatment |
| 4b | Category detail card | Single echo category with trigger/benefit/complication entries |

Cross-fade transitions between levels, matching Binding's gallery↔detail pattern.

#### Wave 3 Inactive State

Transitions, Portents, and GM Notes are dimmed when Waves 1-2 are incomplete:
- Opacity ~0.4 on entire header row
- No chevron rotation, chevron also dimmed
- `cursor: default` (no pointer), no hover state
- Metadata line: "Populates when sections above are complete" (muted italic)
- When Wave 3 activates: fade from 0.4 → 1.0 opacity, chevron becomes interactive

#### Fixed Footer

Footer button fixed at bottom of panel (never scrolls away):
- Per-scene: **"Confirm Scene"** — confirms the current scene and advances to the next
- Once all scenes are confirmed: **"Continue to Delivering"**
- The "Confirm Scene" button is disabled until the Sage signals readiness

### Chat Flow

Per-scene draft-feedback-revise cycle. Sage presents a scene draft, user requests expansions or changes to specific sections. Sage revises. The conversation drives section content — no checkbox progression.

The Sage determines when a scene is ready and signals it conversationally ("I think Scene 2 is complete — shall we confirm?"). The "Confirm Scene" footer button is disabled until the Sage triggers readiness. User clicks to confirm. Both LLM and user are involved in the confirmation decision.

### Workflows

#### Three-Wave Section Model

**Wave 1: Primary Narrative (available immediately)**
- Sections: Overview, Setup, Developments
- User starts here, works through conversation with the Sage
- These group together and are processed roughly in order

**Wave 2: Entities (populate organically)**
- Sections: NPCs Present, Adversaries, Items
- Not a clean transition — these fill in as Wave 1 solidifies
- User doesn't have to interact with these directly if they trust the Sage's work
- But they *can* drill in to review and request changes

**Wave 3: Synthesis (generated on completion of Waves 1-2)**
- Sections: Transitions, Portents, GM Notes
- Hard break — only populate when the first 6 sections are settled
- If Wave 1/2 changes after Wave 3 is generated, Wave 3 resets to inactive

#### Status Model

- No status dots — the flow is conversational. The LLM determines when content is ready, not checkboxes.
- No within-scene locking — sections remain fluid until the entire scene is confirmed.
- Scene-level confirmation only — the confirm action locks all 9 sections at once and advances to the next scene.

#### Shared Patterns

- Section accordion expand/collapse: chevron click toggles
- Detail card navigation: "Back to Scene" link (matches Binding's "Back to Frames")
- Cross-fade transitions between accordion and detail card views
- Fixed footer button pattern (matches Binding/Attuning)
- Entity card styling reused from Conjuring (NPC), Summoning (adversary), Enchanting (items)
- Echo category + trigger/benefit/complication styling reused from Scrying
- Read-aloud blocks are a new shared component — spec in reimagine-ui.md

#### Future Dev: `daggerheart_npcs` Table

NPCs are currently LLM-generated with no database backing. A GitHub issue should be created to add a `daggerheart_npcs` table with columns:
- `id`, `created_at`, `source_book`, `embedding`, `searchable_text` (standard metadata)
- `name`, `role`, `description`, `backstory`, `voice_mannerisms`, `motivation`, `secret`
- `scene_id` (FK), `adventure_id` (FK)

### Mockup

`documentation/mockups/inscribing-immersive.html`

---

## 6. Delivering

> *Your tale awaits.*

The Sage delivers the completed tale — the adventure emerges from the Codex, ready to bring to life at the table.

### Right Panel

A celebratory, narrative panel that tells the story of what was created. No checklists, no stat boxes, no format selectors — this is a "see what we did together" moment, not a review screen.

**Content flow (top to bottom):**

1. **Title** — The adventure name in gold serif, prominent
2. **Spark** — A callback to the very first page: the user's original spark that started the unfolding. Displayed in a subtle card with a label like "Where it began"
3. **Frame Overview** — The descriptive text from the selected frame, showing the world the adventure lives in
4. **Inciting Incident** — The event that sets the adventure in motion
5. **Narrative Send-off** — A block of celebratory text in the Sage's voice: "Your adventure has been delivered. It is now in your hands — take this tale from the pages of the Sage Codex and bring it to life at your table." The exact copy should feel warm, personal, and encourage the user to go run the adventure
6. **"Bring This Tale to Life" button** — Full-width gold CTA. Downloads a zip file containing Markdown and PDF documents. Also silently saves the adventure to the user's Sage Codex account

**What was removed from the old Sealing design:**
- Completeness checklist (breaks immersion — feels like "the ride is over")
- Stat boxes (scenes/NPCs/adversaries/rewards counts)
- Export format selector (no choice needed — single zip with Markdown + PDF)
- "Seal the Spell" button and all spell-casting language

### Chat Flow

Sage presents a warm, celebratory message acknowledging the collaboration. The tone is not "review this" but "look at what we created." The Sage may offer table-running advice if the user asks. The conversation is short — 2-3 messages at most. There is no last-chance review prompt; the panel content speaks for itself.

### Workflows

- **Download action:** Clicking "Bring This Tale to Life" triggers two system actions:
  1. Downloads a zip file to the user's computer containing the adventure as Markdown (.md) and PDF (.pdf) documents
  2. Saves the adventure to the user's account (no UI feedback needed — silent save)
- **No format selection:** Users get both formats in the zip. No JSON export.
- **No editing on this page:** The user cannot modify content here. If they want changes, the Sage directs them back to the relevant stage via the phase dropdown.
- **Single user action:** The only interactive element is the download button. Everything else is read-only content.

### Mockup

`documentation/mockups/delivering-immersive.html`
