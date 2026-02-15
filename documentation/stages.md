# The Ten Stages of Spellweaving

Each adventure in the Book of Many Paths is woven through a 10-stage ritual. Human and AI are co-casters — the Sage guides, the user decides.

## Mockup Status

States: **DONE** (reviewed and iterated), **ITERATION** (mockup exists, under revision), **MOCKUP** (first draft complete).

| # | Stage | State | Mockup |
|---|-------|-------|--------|
| 1 | Invocation | DONE | `documentation/mockups/invocation-immersive.html` |
| 2 | Attunement | DONE | `documentation/mockups/attunement-immersive.html` |
| 3 | Binding | ITERATION | `documentation/mockups/binding-immersive.html` |
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

The panel shows 2 ungrouped components (no group labels). Each component row is clickable, opening a read-only summary panel. A "Continue to Attunement" button sits below the last component, disabled until Spark is confirmed. Title is optional — the adventure can remain "Untitled."

| Component | Question | Selection | Behavior |
|------|----------|-----------|----------|
| **Spark** | What's the seed of your adventure? | Read-only summary | Populated by the Sage once it distills the user's vision from conversation. Not user-editable. |
| **Title** | What will you call this adventure? | Read-only summary | Populated once user and Sage settle on a name. Optional — adventure can proceed as "Untitled." |

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

(To be documented)

### Mockup

`documentation/mockups/attunement-immersive.html`

---

## 3. Binding

> *Which frame holds the story?*

Binding the spell to a foundation — a two-step process selecting the thematic framework (Frame) and a specific narrative anchor point (Setting) within it. Frames come from the `daggerheart_frames` Supabase table; Settings are AI-generated based on the selected frame.

### Right Panel

Frame Gallery → Settings Panel (Attunement-style cross-fade transition)

**Frame gallery** (default view):
- Scrollable frame cards from Supabase (name, 1-line description, theme pills)
- Three card states:
  - **Default** — subtle border, shows frame name + description + theme pills
  - **Exploring** — white/light border on all sides (clicked, viewing settings for this frame)
  - **Selected** — gold left-border + gold-dim background; description and theme pills hidden, replaced by setting name (em dash prefix, serif 14px bold, gold) + 1-line setting description (13px, secondary color)

**Settings sub-panel** (after clicking a frame):
- Header: "Back to Frames" text button (matches Attunement's back button pattern) + frame name below
- Subtitle: "Where does your adventure take root?"
- 3–5 setting cards, AI-generated based on the selected frame
- A Setting = single narrative anchor point; description can encompass multiple locations (e.g., "A haunted forest outside the Village of Holdenbatten")
- No confirm button — user selects a setting card and clicks "Back to Frames" to confirm (same implicit pattern as Attunement)
- Select + back = confirmed: selecting a setting and returning confirms the frame+setting pair
- Back without selecting = frame reverts to default styling
- Re-entry: clicking a confirmed frame reopens settings with the previous selection pre-highlighted; user can change or go back

Continue button: disabled until frame + setting are both confirmed. Clicking a different frame clears the previous selection.

### Chat Flow

Sage presents available frames. User explores via conversation — Sage describes themes, factions, and connections to tuned components. When settings appear, Sage elaborates on options. After setting confirmed, Sage acknowledges and invites progression to Weaving.

### Workflows

- AI generates 3–5 setting suggestions when a frame is clicked (loading state in production)
- Users can request edits to setting cards via chat
- Users CANNOT edit Frames — they are read-only from the database
- User can describe a custom setting via chat instead of picking a card
- Clicking a different frame after confirming resets the previous selection (setting content cleared, desc+pills restored)
- Settings panel shows a loading/generating state before cards appear (in production)
- Implicit confirmation: selecting a setting card + clicking "Back to Frames" confirms the pair; no explicit confirm button
- Re-entry to a confirmed frame shows the settings panel with the previously chosen setting pre-highlighted
- Selected frame card hides description and theme pills; shows setting name (em dash prefix) + description instead. Cleared when selection is reset.

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
