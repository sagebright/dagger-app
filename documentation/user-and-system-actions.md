# User & System Actions

Dynamic behaviors across the Sage Codex that cannot be represented in static mockups. This document serves as a bridge between mockups and user stories — covering button states, editability rules, navigation constraints, system-initiated generation, and backend workflows.

**Convention:** Items marked with **(UNCERTAIN)** are promising design ideas that haven't been finalized. Items marked with **(OPEN QUESTION)** require a decision before implementation.

---

## Cross-Stage Behaviors

### Visual Design System

The mockups establish a strict dark-mode color palette. Gold is the ONLY chromatic color — everything else is neutral. This is a hard design rule, not a suggestion.

**Core Palette:**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1c1b1f` | Warm near-black. Main background. No purple. |
| `--bg-secondary` | `#252428` | Subtle elevation for panels, input area. |
| `--bg-surface` | `#2e2d32` | Cards, hover states. Still very muted. |
| `--text-primary` | `#e8e4de` | Warm off-white. Body text. |
| `--text-secondary` | `#9d9a93` | Muted warm gray for labels, metadata. |
| `--text-muted` | `#6b6862` | Least-important text. |
| `--accent-gold` | `#d7a964` | The only accent. Confirmed states, focus rings, CTA buttons. Used sparingly. |
| `--accent-gold-dim` | `rgba(215, 169, 100, 0.15)` | Faint gold wash for selected items, hover states. |
| `--accent-gold-border` | `rgba(215, 169, 100, 0.25)` | Subtle gold borders on focus/confirmed. |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Panel dividers, input borders. Nearly invisible. |
| `--border-medium` | `rgba(255, 255, 255, 0.12)` | Slightly more visible borders when needed. |

**Typography:**

| Role | Font | Size | Notes |
|------|------|------|-------|
| Headers/labels | Lora (serif) | — | Warm, readable, signals "crafted" without costume |
| Body/UI | Inter (sans) | 15px, 1.6 line-height | Comfortable reading at body size |
| Input placeholder | Inter italic | — | Conversational: "What are you thinking?" |

**Entity Label Colors** (color-coded for quick scanning):

NPC Roles: Leader `#d4a574`, Antagonist `#db7e7e`, Oracle `#8bc4a8`, Scout `#8badc4`, Minor `#a09590`

Adversary Types: Bruiser `#e07c5a`, Minion `#8b9dc3`, Leader `#c98bdb`, Solo `#db6b6b`

Item Types: Weapon `#d4836d`, Armor `#8b9fb8`, Consumable `#8bc4a8`, Item `#c4b08b`

All entity labels follow the same structural pattern: colored text + tinted background (0.08 opacity) + tinted border (0.35 opacity). Scene badges and frame attribute pills stay neutral.

**Animation Philosophy** (immersion, not decoration):

| Animation | Purpose |
|-----------|---------|
| Thinking indicator | Staggered gold dot pulse (life, not loading) |
| Text streaming | Characters at reading pace with gold cursor (presence) |
| Input focus glow | Gold border fade-in on focus (acknowledgment) |
| Component confirmation | Brief gold shimmer (celebration without fanfare) |
| Panel transitions | Cross-fade between views (continuity) |
| Message appear | Fade-in with slight upward slide (natural flow) |

All achievable with CSS animations + requestAnimationFrame streaming. No external animation libraries.

### Architectural Direction

The backend uses an Express API server (`apps/api/`, port 3001) that calls the Anthropic API directly via the Anthropic SDK.

- **Architecture**: Direct Anthropic SDK calls from the API server — no intermediary bridge.
- **Why**: Speed, simplicity, and the LLM-driven panel update model (see below) requires tight integration.
- **Supabase**: Content queries are served by the API server's service layer (`apps/api/src/services/`).

### 6-Stage Dropdown Navigation

The dropdown (visible in Weaving and Inscribing mockups) allows navigation to any completed stage. When navigating backward:

- **Panel**: Read-only snapshot of the confirmed state. No interaction — no accordion expansion, no button clicks, no card selection.
- **Chat**: Read-only transcript. No new messages can be sent.
- **Purpose**: Orientation and review only. The user can see what they decided, but cannot change it.

Navigating forward (back to the current active stage) restores full interactivity.

### Header Bar & Adventure Name

The adventure name appears in the header bar across all stages.

| Stage | Header Bar State |
|-------|-----------------|
| Invoking | No name displayed (or hidden entirely) |
| Attuning | Placeholder name appears (e.g., "[Username]'s New Adventure" — clearly placeholding, not "Untitled") |
| Binding | Placeholder persists |
| Weaving | Sage suggests a name based on the full arc. User can approve, edit, or ask for alternatives. On approval, the placeholder is replaced with the real name. |
| Inscribing | Confirmed name displayed. Not editable. |
| Delivering | Confirmed name displayed prominently. |

The name is NOT asked for during Invoking. It emerges organically during Weaving when the Sage has enough context (full scene arc) to suggest something meaningful.

### Forward-Only Progression

Users cannot go backward to edit previous stages. This is a hard constraint:

- **If the user asks to go back**: The Sage explains that previous stages are sealed, but the user will receive the adventure as downloadable documents (Markdown + PDF) where they can make any changes they want.
- **Why**: Backward edits cascade. Changing the tier in Attuning would invalidate adversary stat blocks in Inscribing. The cost of supporting backward propagation outweighs the benefit.
- **Exception**: The 6-stage dropdown allows view-only backward navigation (see above).

### Stage Advancement Buttons

Every stage has a fixed footer button that advances to the next stage. These share common behaviors:

- **Fixed position**: Pinned to the bottom of the panel. Never scrolls away, regardless of content length.
- **Disabled by default**: Buttons start in a disabled (faded) state.
- **Enabled by the system**: The system determines when the stage requirements are met and enables the button. The mechanism is an implementation detail — from the user's perspective, the button activates when things are ready.
- **Single click**: Clicking the enabled button confirms the current state and advances to the next stage. This is irreversible.
- **Consistent styling**: Full-width, `padding: 7px 16px`, `border-radius: 8px`, `font-size: 13px` — matching across all stages.

### LLM-Driven Panel Content Updates

The core interaction model across Weaving, Inscribing, and (to a lesser extent) Binding is: **the user gives feedback in chat, and the LLM updates the text content displayed in the right panel.** The panel is not a static display — it is a live document that the LLM rewrites in response to conversation.

This means the LLM must be able to programmatically modify specific panel content:

| Stage | What the LLM Updates |
|-------|---------------------|
| Binding | Frame properties (when user requests a tweak — generates a derivative frame whose content replaces the panel display) |
| Weaving | Scene arc text (title, description, beat structure) for the active scene |
| Inscribing | Any of the 9 section contents for the active scene — narrative text, NPC details, adversary selections, item lists, portent entries, GM notes |

**What this looks like to the user:** The user says "make the opening more tense" in chat. The Sage acknowledges and revises. The Setup section text in the panel changes to reflect the revision. The user never edits panel text directly — all modifications flow through conversation with the Sage.

**Why this needs strategic discussion:** This is the most architecturally significant behavior in the app. The implementation must support:
- **Targeted updates**: The LLM needs to update specific sections/fields without regenerating the entire panel. A tweak to one NPC's name shouldn't require re-rendering all 9 sections.
- **Streaming or batched display**: When the LLM rewrites a section, does the new text stream in (character by character, matching the chat animation philosophy), or does it swap in as a block? This affects perceived responsiveness.
- **State synchronization**: The panel content and the LLM's internal understanding of that content must stay in sync. If the user asks "what did you change?", the Sage should be able to reference exactly what's in the panel.
- **Propagation within a scene**: Changes to one section can ripple to others. Renaming an NPC in the "NPCs Present" section means references in Setup, Developments, and Transitions must also update. The LLM needs to handle this cascade.
- **Undo/revision history**: If the user says "actually, go back to the previous version of Setup," the system needs access to prior versions of section content. Whether this is LLM memory, explicit version storage, or conversation replay is an open implementation question.
- **Structured output**: The LLM's panel updates likely need to be structured (JSON, tool calls) rather than freeform text, so the frontend knows which section to update and with what content. This constrains the LLM's output format.

**(OPEN QUESTION)** The exact mechanism for LLM → panel updates has not been designed. This is a prerequisite for implementing Weaving and Inscribing and should be resolved early in the technical architecture phase.

### Sage Readiness Signals

In stages where content is confirmed scene-by-scene (Weaving, Inscribing), the Sage determines when a scene is ready for confirmation. The confirm button is disabled until the system signals readiness.

From the user's perspective: the Sage says something like "I think this scene is ready" and the button becomes clickable. The internal mechanism (structured tool call, metadata flag, conversational parsing) is an implementation detail.

### Post-Adventure Content Cleanup

After an adventure is completed, background system workflows capture everything that was generated during the session:

| Content Type | Action | Purpose |
|-------------|--------|---------|
| Frames (generated on-the-fly) | Save to `daggerheart_frames` (or equivalent) | Human review for permanent roster |
| Frames (user-tweaked derivatives) | Save as new entries with generation flag | Human review for permanent roster |
| Unselected generated frames | Save with "not selected" flag | Human review — may still be useful |
| NPCs | Save to `daggerheart_npcs` (future table) | Build NPC library over time |
| Adversaries (custom) | Save with generation metadata | Human review for reuse |
| Environments (generated) | Save to `daggerheart_environments` | Build environment library over time |

All generated content is flagged with how it was created (human-collaborated vs. fully auto-generated) so admins can review and approve items for the permanent content library.

---

## 1. Invoking

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Share vision | Type in chat | Freeform conversation — user describes what kind of adventure they want |
| Approve Spark | Conversational confirmation ("Yeah, that's what I'm going for") | Sage populates the Spark display in the panel. "Continue to Attuning" button enables. |
| Advance to Attuning | Click "Continue to Attuning" | Stage transitions. Spark is sealed. |

The user does NOT:
- Name the adventure (name comes in Weaving)
- Select from predefined options (this is pure conversation)
- Edit the Spark text directly (it's Sage-authored, read-only)

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Open with introduction | Stage entry | Sage sends a combined introduction + vision prompt message |
| Probe for vision | User shares initial idea | Sage asks follow-up questions to draw out the vibe, scope, and feel |
| Confirm understanding | Sufficient vision shared | Sage restates what it heard in a compelling way ("I see a story about...") |
| Distill Spark | User confirms understanding | Sage writes the Spark summary and populates the panel |
| Enable advancement | Spark confirmed | "Continue to Attuning" button activates |
| Carry context forward | Stage transition | User's vision informs frame selection in Binding and (UNCERTAIN) component pre-population in Attuning |

### Button States

| Button | Default | Enabled When |
|--------|---------|-------------|
| Continue to Attuning | Disabled (faded) | Spark is confirmed (user approved the Sage's distillation) |

### Open Questions

- **(UNCERTAIN)** Should the system pre-populate Attuning components based on what the user shares in Invoking? For example, if the user says "a one-shot for 4 players," should Members auto-confirm as "4 Players"? The brainwalk describes this as "amazing" but does not commit to it.

---

## 2. Attuning

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Open component choice panel | Click a component row | Panel cross-fades from summary view to choice panel for that component |
| Select an option | Click an option card in the choice panel | Card highlights with gold treatment. "Select [Component]" button enables. |
| Confirm selection | Click "Select [Component]" button | Returns to summary view. Component row shows confirmed gold treatment. |
| Cancel selection | Click "Return to Attuning" link | Returns to summary view. No selection applied — any in-panel selection is cleared. |
| Advance to Binding | Click "Continue to Binding" | Stage transitions. All 8 components sealed. |

The user does NOT:
- Type custom values (all selections are predefined choices)
- Confirm partially (all 8 must be confirmed before advancing)
- Change a confirmed component without re-entering the choice panel

For **Threads** (multi-select up to 3): The user selects up to 3 thread cards before clicking "Select Threads." The button label is contextual ("Select Threads," not generic "Confirm").

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Enforce all-8 requirement | Ongoing | "Continue to Binding" stays disabled until every component has a confirmed selection |
| Contextual button label | User opens a choice panel | Footer button reads "Select Tenor," "Select Pillars," etc. |

### Button States

| Button | Default | Enabled When |
|--------|---------|-------------|
| Select [Component] | Disabled (faded) | User has selected at least one option in the choice panel |
| Continue to Binding | Disabled (faded) | All 8 components are confirmed |

### Interaction Details

- Selecting a different option within a choice panel deselects the previous one (single-select components).
- Clicking "Return to Attuning" discards any in-progress selection — it does NOT auto-save.
- Re-entering a previously confirmed component's choice panel shows the current selection highlighted. The user can change it and re-confirm.

---

## 3. Binding

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Explore a frame | Click a frame card in gallery | Gallery cross-fades to frame detail panel. Card enters "Exploring" state (white border). |
| Read frame details | Scroll detail panel | Collapsible accordion sections — user can expand/collapse any section |
| Confirm frame | Click "Select Frame" (fixed footer in detail panel) | Returns to gallery. Frame card enters "Active" state (gold treatment). |
| Return without selecting | Click "Back to Frames" link | Returns to gallery. No frame is active — exploring state cleared. |
| Request frame tweak | Chat message (e.g., "Can we change the civil war to undead uprising?") | Sage modifies the frame. System generates a new derivative frame. |
| Advance to Weaving | Click "Continue to Weaving" | Stage transitions. Frame is sealed. |

The user does NOT:
- Edit frame text directly in the panel (frames are read-only in the panel UI)
- Have multiple frames active simultaneously (selecting a new frame clears the previous)

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Present frames | Stage entry | System selects ~3 frames that match the user's Invoking vision and Attuning components. These may come from the database or be generated on-the-fly. |
| Generate frames on-the-fly | No good database matches, or user requests more options | System creates new frames with all properties (overview, inciting incident, factions, etc.) and presents them |
| Save all generated frames | Ongoing (background) | Every frame generated during the session — selected or not — is saved to the database with a generation flag for human review |
| Create derivative frame | User requests a tweak via chat | System generates a new frame based on the original + user's requested changes. The derivative replaces the original in the gallery (or is added alongside it). Saved to DB. |
| Elaborate in conversation | User clicks a frame / asks questions | Sage can discuss themes, factions, inciting incidents, and connections to the user's tuned components |

### Button States

| Button | Default | Enabled When |
|--------|---------|-------------|
| Select Frame | Always visible (fixed footer in detail panel) | Always enabled — clicking it confirms the currently viewed frame |
| Continue to Weaving | Disabled (faded) | A frame is in "Active" state (user has confirmed one via "Select Frame") |

### Interaction Details

- The inciting incident is displayed prominently on the gallery card (not buried in detail sections). This is the most important decision-making information.
- Frame detail sections: Overview and Inciting Incident are expanded by default. All others (Tone & Feel, Touchstones, Themes, etc.) are collapsed.
- Expanded section titles turn gold. Multiple sections can be expanded simultaneously.
- Hovering on label pills (Tone & Feel, Touchstones, Themes) turns them gold.
- Clicking a different frame after confirming one resets the previous — only one frame can be Active.

---

## 4. Weaving

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Review scene arc | Read panel content for active scene | User sees the scene title, subtitle, and full arc description |
| Request changes | Chat message | Sage revises the active scene's arc based on feedback |
| Request scene reordering | Chat message (e.g., "swap Scenes 2 and 3") | Sage restructures the scene order |
| Approve adventure name | Conversational confirmation | Sage's suggested name replaces the placeholder in the header bar |
| Request name alternatives | Chat message | Sage offers new name suggestions |
| Confirm scene | Click "Confirm Scene Summary" | Active scene locks (tab → confirmed). Next scene activates. |
| Advance to Inscribing | Click "Continue to Inscribing" (final scene only) | Confirms final scene and transitions to Inscribing. |

The user does NOT:
- Edit scene text directly in the panel (all changes go through conversation)
- Interact with confirmed scene tabs (they are non-clickable)
- Skip scenes (must confirm in order: 1 → 2 → 3 → ...)

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Draft scene arcs | Stage entry | **(OPEN QUESTION)** Does the system generate all scene arcs at once on entry, or progressively per scene? stages.md leans toward all-at-once ("Sage drafts initial outline based on frame + components and populates all scene arcs in the panel"), but this wasn't explicitly confirmed. |
| Revise arc | User requests changes | Sage updates the arc text in the panel. Only the active scene's arc is editable. |
| Surface adventure name | Sufficient arc context established | Sage suggests a name. User can approve, edit, or request alternatives. |
| Signal readiness | Scene content is satisfactory | System enables the "Confirm Scene Summary" button |
| Lock scene | User clicks confirm | Scene tab transitions to "confirmed" state. Content becomes read-only. |
| Advance active tab | Scene confirmed | Next scene tab transitions from "inactive" to "active" state |

### Scene Tab States

| State | Visual | Clickable? |
|-------|--------|-----------|
| Active | Gold fill background, dark text, weight 600 | No (it's already the current view) |
| Confirmed | Gold-dim wash background, secondary text | No (locked, not interactive) |
| Inactive | Surface background, secondary text | No (not yet reachable) |

### Button States

| Button | Default | Enabled When | Label |
|--------|---------|-------------|-------|
| Scene confirm (Scenes 1 to N-1) | Disabled | System signals readiness | "Confirm Scene Summary" |
| Scene confirm (final scene) | Disabled | System signals readiness AND name is confirmed | "Continue to Inscribing" |

### Interaction Details

- Conversation is scene-focused: while Scene 1 is active, dialogue centers on Scene 1. User can reference other scenes, but only the active scene is editable.
- If the user wants to revisit a confirmed scene's content, they can discuss it in chat but the panel shows it as locked. Major changes would require the Sage to propose unlocking — this is expected to be rare.
- **(UNCERTAIN)** Whether the "Continue to Inscribing" button requires the name to be confirmed, or if the name can still be a placeholder at that point. The brainwalk implies the name should be settled before Inscribing, but doesn't explicitly make it a gate.

---

## 5. Inscribing

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Expand/collapse sections | Click chevron on accordion header | Section content toggles visibility |
| View narrative detail | Click section name (Setup, Developments, Transitions) | Cross-fade to detail card with full text + read-aloud blocks |
| View NPC detail | Click an NPC card in expanded "NPCs Present" section | Cross-fade to NPC detail card (full treatment: name, role, description, backstory, voice, motivation, secret) |
| View adversary detail | Click an adversary card in expanded "Adversaries" section | Cross-fade to adversary detail card (full stat block) |
| View portent category | Click a category row in expanded "Portents" section | Cross-fade to category detail card (echo entries with trigger/benefit/complication) |
| Return from detail | Click "Back to Scene" link | Cross-fade back to section accordion |
| Request content changes | Chat message | Sage revises section content. User can request NPC name changes, adversary swaps, etc. |
| Confirm scene | Click "Confirm Scene" | All 9 sections lock. Active tab → confirmed. Next scene activates. |
| Advance to Delivering | Click "Continue to Delivering" (final scene only) | Confirms final scene and transitions to Delivering. |

The user does NOT:
- Edit content directly in the panel (all changes go through conversation)
- Interact with confirmed scene tabs
- Expand Wave 3 sections while Waves 1-2 are incomplete (they are dimmed and non-interactive)
- Click through to Item detail cards (Items show Enchanting-style cards inline — no drill-in)

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Generate Wave 1 (Overview, Setup, Developments) | Scene becomes active | Available immediately. Sage drafts narrative content. |
| Generate Wave 2 (NPCs, Adversaries, Items) | Wave 1 content solidifies | Populates organically as narrative takes shape. Not a clean break — fills in progressively. |
| Generate Wave 3 (Transitions, Portents, GM Notes) | Waves 1-2 are settled | Hard transition — only populates when the first 6 sections are complete. Sections fade from dimmed (0.4 opacity) to full opacity. |
| Reset Wave 3 | User makes changes to Wave 1/2 after Wave 3 has generated | Wave 3 reverts to inactive/dimmed state. Content is regenerated once Waves 1-2 re-settle. |
| Warn about game balance | User requests changes that affect balance (e.g., "make this fight harder") | Sage explains the implications ("I can do that, but it bumps this up to a harder encounter") and makes the change if user confirms |
| Signal readiness | All 9 sections are satisfactory | System enables the "Confirm Scene" button |
| Lock scene | User clicks confirm | All 9 sections become read-only. Scene tab → confirmed. |

### Wave 3 Inactive State

When Waves 1-2 are incomplete, Wave 3 sections display:
- Entire header row at ~0.4 opacity
- Chevron dimmed, no rotation
- `cursor: default` (no pointer), no hover state
- Metadata line: "Populates when sections above are complete" (muted italic)
- On activation: fade from 0.4 → 1.0 opacity, chevron becomes interactive

### Section Interaction Patterns

| Section Type | Collapsed | Expanded | Click-Through |
|-------------|-----------|----------|--------------|
| Overview | Metadata preview line | Full content inline | None |
| Setup, Developments, Transitions | Metadata preview line | Descriptive text (no read-aloud) | Detail card with full text + read-aloud blocks |
| NPCs Present | Bare section name | Compact NPC cards (name + description) | Per-NPC detail card |
| Adversaries | Bare section name | Compact adversary cards (name + type badge + difficulty) | Per-adversary stat block card |
| Items | Bare section name | Enchanting-style item cards with type labels | None |
| Portents | Bare section name | 5 echo category rows with count badges | Per-category detail card |
| GM Notes | Metadata preview line | Full content inline | None |

### Button States

| Button | Default | Enabled When | Label |
|--------|---------|-------------|-------|
| Scene confirm (Scenes 1 to N-1) | Disabled | System signals readiness (all 9 sections settled) | "Confirm Scene" |
| Scene confirm (final scene) | Disabled | System signals readiness | "Continue to Delivering" |

### Interaction Details

- The speaking icon (speech bubble) appears on Setup, Developments, and Transitions accordion headers — signaling "click through for read-aloud content."
- Read-aloud blocks appear ONLY in detail cards, never in accordion previews.
- NPC and adversary changes requested via chat propagate through the narrative. If the user changes an NPC's name, subsequent references in the narrative sections update.
- Sections remain fluid within a scene until the entire scene is confirmed. There is no within-scene locking — the confirm action locks all 9 sections at once.

---

## 6. Delivering

### User Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Download adventure | Click "Bring This Tale to Life" | Browser downloads a zip file containing Markdown (.md) and PDF (.pdf) documents |

That is the only interactive element. Everything else on this page is read-only content.

The user does NOT:
- Edit any content on this page
- Choose export formats (both Markdown and PDF are included automatically)
- Review a checklist or stat summary (these were intentionally removed for immersion)

### System Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Render celebration panel | Stage entry | Panel displays: adventure title, Spark callback, frame overview, inciting incident, narrative send-off |
| Generate download package | User clicks download button | System generates a zip containing Markdown and PDF versions of the full adventure |
| Silent account save | User clicks download button | Adventure is saved to the user's Sage Codex account. No UI feedback — this happens silently alongside the download. |
| Post-adventure cleanup | Adventure completion | Background workflows save all generated content to the database for human review (see Cross-Stage Behaviors) |

### Chat Flow

The Sage presents a warm, celebratory message (2-3 messages max). The tone is "look at what we created together," not "review this." If the user asks questions, the Sage can offer table-running advice. There is no last-chance review prompt.

### Button States

| Button | Default | Enabled When | Label |
|--------|---------|-------------|-------|
| Download | Always enabled | Stage entry | "Bring This Tale to Life" |

---

## Appendix: Actions Not Yet Assigned to a Stage

These behaviors emerged from the brainwalk but don't have a clear stage home yet.

### Frame Creation Workflow

When the system generates frames on-the-fly (Binding stage), the full creation workflow is:

1. System evaluates user's vision (from Invoking) + components (from Attuning) against the frame database
2. If sufficient matches exist: present ~3 database frames
3. If insufficient matches: generate new frames with all properties filled (overview, inciting incident, factions, typical adversaries, tone/feel, themes, touchstones, etc.)
4. If user rejects all options and asks for more: generate additional frames
5. All generated frames (selected or not) are saved to the database with metadata:
   - `generation_method`: "database" | "auto-generated" | "human-collaborated" (user-tweaked)
   - Whether the frame was ultimately selected
6. Human admins review generated frames later and can approve them for the permanent roster

### Environment Generation

**(UNCERTAIN)** The brainwalk discusses environments being created during adventure generation — e.g., "this starts in a tavern, goes to a forest." The system would create full environment entries (with dispositions, typical adversaries, tier-appropriate properties) for each location referenced in the adventure. These would be saved to the database for reuse. This is not yet reflected in any mockup or stage documentation.

### Content Review Queue

All content generated during an adventure session is flagged for human review:
- Frames (new and derivative)
- NPCs (all are currently LLM-generated, no database table yet)
- Custom adversaries (if any were generated beyond database entries)
- Environments (if generated)

The review queue is an admin-facing feature, not visible to the adventure-creating user.
