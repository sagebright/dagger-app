# Reimagining the Dagger-App UI

## The Problem

The dagger-app web interface works functionally but feels utilitarian. The goal is to reach the level of immersion that Claude's desktop app achieves: an interface that disappears so the conversation becomes the experience.

Specific issues identified:
- Saturated purple backgrounds on every surface overwhelm the eye
- Gold borders and accents on every card dilute their meaning
- Chat input is single-line, not sticky, feels sterile ("ordering at a steel lunch counter")
- Right panel is not viewport-contained (requires scrolling)
- No animation or transitions — every state change is a hard cut
- Heavy message bubble backgrounds segment the conversation into transactions
- The overall feel is "an engineer designed it" rather than "a designer designed it"

## Why Claude's Desktop App Feels Immersive

Three principles that compound:

### 1. The Interface Disappears

Claude uses an almost monochrome palette — warm off-whites, subtle grays, one accent color used with extreme restraint. No heavy borders, no saturated backgrounds, no decorative elements competing for attention. The conversation is the only thing you see.

This is counterintuitive: more visual richness does not equal more immersion. The opposite is true. Immersion happens when the container vanishes and you forget you're using software. Every border, every saturated background, every bold color boundary is a reminder that you're looking at a screen.

### 2. Breathing Room Signals "Stay a While"

Claude's spacing is generous — between messages, around the input area, in line heights. Dense, tight spacing says "this is a tool, be efficient." Generous spacing says "take your time, think, explore."

The input area is the most important example. It's tall, rounded, with inner padding that makes it feel like a writing space rather than a command line. It invites paragraphs, not keywords.

### 3. Motion Creates the Illusion of Presence

Without animation, every state change is a hard cut — and hard cuts remind you that you're interacting with a state machine. Thinking pulses, streaming text, subtle transitions between states all serve one purpose: they make the system feel alive. Not flashy — alive.

## Translation Principle: Fantasy as Atmosphere, Not Costume

The difference between a Halloween store and a high-end fantasy bookshop: both are "fantasy themed." The Halloween store has every surface covered in orange and black, fake cobwebs, spooky fonts on every sign. The bookshop has warm wood, soft lighting, and one beautiful map on the wall. The bookshop is immersive. The Halloween store is theatrical.

**Purple and gold should be spices, not the main course.** The vast majority of the screen should be calm, warm, neutral — a surface that recedes. The fantasy palette appears in moments: a confirmed component, a focused input, a Sage message beginning to stream. When gold appears, it means something. When everything is gold, nothing does.

## Design System Foundation

### Color Palette (Dark Mode)

| Token | Value | Rationale |
|-------|-------|-----------|
| `--bg-primary` | `#1c1b1f` | Warm near-black. No purple. Eye rests here. |
| `--bg-secondary` | `#252428` | Subtle elevation for panel, input area. Barely lighter. |
| `--bg-surface` | `#2e2d32` | Cards, hover states. Still very muted. |
| `--text-primary` | `#e8e4de` | Warm off-white. Reads as cream without screaming "parchment." |
| `--text-secondary` | `#9d9a93` | Muted warm gray for labels, metadata. |
| `--text-muted` | `#6b6862` | Very muted for least-important text. |
| `--accent-gold` | `#d7a964` | The only accent. Used sparingly: confirmed states, focus rings, CTA buttons. |
| `--accent-gold-dim` | `rgba(215, 169, 100, 0.15)` | Faint gold wash for selected items, hover states. |
| `--accent-gold-border` | `rgba(215, 169, 100, 0.25)` | Subtle gold borders on focus/confirmed. |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | Panel dividers, input borders. Nearly invisible. |
| `--border-medium` | `rgba(255, 255, 255, 0.12)` | Slightly more visible borders when needed. |

**Key principle:** Gold is the ONLY chromatic color. Everything else is neutral.

### Typography

- **Serif (headers/labels):** Lora — warm, readable, signals "crafted" without "costume." Replaces Cinzel.
- **Sans (body/UI):** Inter — comfortable reading at 15px with 1.6 line-height.
- **Message body:** 15px Inter, generous line-height for breathing room.
- **Input placeholder:** Italic, conversational: "What are you thinking?"

### Layout Principles

- Entire page is viewport-locked (`h-screen`), zero outer scroll
- Chat: messages scroll internally, input pinned to bottom
- Panel: header and action button pinned, component list scrolls internally
- Panel divider: 1px subtle line, not a heavy border
- 60/40 split (chat/panel)

### Message Treatment

- Sage messages: left-aligned, no background, small "Sage" serif label above
- User messages: right-aligned, very faint background tint, no label
- Generous spacing (24px between messages)
- Max-width ~85% to prevent wall-to-wall text

### Animation Philosophy

Animations serve immersion, not decoration:
- **Thinking indicator**: Staggered gold dot pulse (life, not loading)
- **Text streaming**: Characters at reading pace with gold cursor (presence)
- **Input focus glow**: Gold border fade-in on focus (acknowledgment)
- **Component confirmation**: Brief gold shimmer (celebration without fanfare)
- **Panel transitions**: Cross-fade between views (continuity)
- **Message appear**: Fade-in with slight upward slide (natural flow)

All achievable with CSS animations + existing RAF streaming. No external libraries needed.

### Scene Badge (Shared Component)

A muted pill badge for scene association on content entries. Deliberately NOT gold — scene badges are informational metadata, not interactive highlights.

| Property | Value | Rationale |
|----------|-------|-----------|
| Font | 11px Inter, weight 500 | Readable but subordinate to entry names |
| Color | `--text-muted` | Quiet — does not compete with gold accents |
| Background | `--bg-surface` | Slight elevation from card background |
| Border | 1px `--border-medium` | Subtle definition without heaviness |
| Border radius | 12px | Pill shape, consistent with role tags |
| Padding | 1px 10px | Compact horizontal feel |
| Label format | "Scene 1" (full word) | Immersive — no abbreviations |
| Multi-scene | Side-by-side separate pills | Each in its own `.scene-badge` span |

Used in: NPC cards (Inscribing entity drill-in), adversary cards (Inscribing entity drill-in). Scene selector filter tabs use the same "Scene N" label format for consistency.

### Read-Aloud Block (Shared Component)

Distinct styling for GM read-aloud text in narrative sections (Setup, Developments, Transitions). Appears **only inside detail cards**, never in accordion previews. Communicates "this is the Sage's storytelling voice" — text the GM reads verbatim to players.

| Property | Value | Rationale |
|----------|-------|-----------|
| Border-left | 3px solid `--accent-gold` | Gold accent signals "special content" |
| Background | `--accent-gold-dim` | Faint gold wash separates from surrounding prose |
| Border-radius | 0 8px 8px 0 | Rounded on right side only (left has the border accent) |
| Font | 15px `--font-serif`, italic | Serif italic = the Sage's storytelling voice |
| Color | `--text-primary` | Full contrast for readability — this is the important text |
| Padding | 14px 16px | Generous internal space for reading comfort |
| Label | "READ ALOUD" (above block) | 11px `--font-sans`, weight 500, `--text-muted`, uppercase, 0.04em spacing |
| Margin | 16px 0 | Breathing room from surrounding prose |

First used in: Inscribing (Setup, Developments, Transitions detail cards). May appear in future stages if read-aloud patterns expand.

### Speaking Icon (Shared Component)

A small audio/voice icon shown next to section names that contain read-aloud content. Signals "click through for read-aloud text" without cluttering the accordion preview.

| Property | Value | Rationale |
|----------|-------|-----------|
| Icon | Speech bubble SVG (message outline) | Universally readable "speech" symbol at small sizes — signals read-aloud content |
| Size | 16x16px | Small enough to not compete with section name |
| Color | `--text-muted` | Quiet by default |
| Hover color | `--accent-gold` | Gold on hover confirms interactivity |
| Cursor | pointer | Clickable — opens detail card |
| Placement | After section name, before any trailing elements | Right of the text, left of the edge |

Used in: Inscribing accordion headers (Setup, Developments, Transitions sections).

### Color-Coded Entity Labels (Shared Pattern)

Entity labels (NPC roles, adversary types, item types) use color to encode categorical information for quick scanning. All follow the same structural pattern: colored text + subtle tinted background + tinted border at 0.35 opacity + background at 0.08 opacity. Scene badges and frame attribute pills stay neutral — they're navigational metadata, not tactical categories.

**NPC Role Colors** (warm, human tones):

| Role | Color | Hex | Reasoning |
|------|-------|-----|-----------|
| Leader | Warm amber | `#d4a574` | Authority, warmth |
| Antagonist | Warm red | `#db7e7e` | Tension, opposition |
| Oracle | Sage green | `#8bc4a8` | Wisdom, guidance |
| Scout | Steel blue | `#8badc4` | Practical, military |
| Minor | Warm taupe | `#a09590` | Present but not prominent |

**Adversary Type Colors** (tactical combat tones — established in Summoning):

| Type | Color | Hex | Reasoning |
|------|-------|-----|-----------|
| Bruiser | Coral | `#e07c5a` | Heavy, aggressive |
| Minion | Cool blue | `#8b9dc3` | Numerous, disposable |
| Leader | Purple | `#c98bdb` | Commanding, magical |
| Solo | Red | `#db6b6b` | Dangerous, singular |

**Item Type Colors** (material/object tones):

| Type | Color | Hex | Reasoning |
|------|-------|-----|-----------|
| Weapon | Copper | `#d4836d` | Danger, forged metal |
| Armor | Slate | `#8b9fb8` | Protection, steel |
| Consumable | Sage green | `#8bc4a8` | Potions, nature, healing |
| Item | Warm tan | `#c4b08b` | General treasure, parchment |

CSS class pattern: `.entity-role-tag.role-leader`, `.adversary-type-badge.type-bruiser`, `.item-type-label.type-weapon`. Each overrides the neutral base with colored text, border, and background.

Used in: Inscribing (NPC detail cards, adversary cards, item cards). Reference patterns in Conjuring, Summoning, Enchanting mockups.

### Section Detail Card (Shared Pattern)

Reuses Binding's gallery↔detail cross-fade pattern for navigating from a list view into a focused content view. The detail card replaces the list view entirely — no split pane.

**Structure:**
- "Back to [parent]" text link at top (icon + text, muted, gold on hover)
- Title as header (16px serif, weight 600)
- Optional subtitle (13px, `--text-secondary`)
- Scrollable content body (14px, `--text-secondary`, 1.65 line-height)

**Transition:** Cross-fade between views — hide all panel views, show the target. Scroll resets to top on entry.

**Back button styling:** Matches Binding's `.back-btn` pattern — flex row, 13px sans-serif, `--text-muted` default, `--accent-gold` on hover, left-chevron SVG icon.

First used in: Binding (frame detail). Extended in: Inscribing (narrative detail cards, NPC detail cards, adversary detail cards).

## Strategic Path

1. **Lock the atmosphere** — HTML mockup iteration on component tuning page
2. **Bring the engine to life** — Direct Anthropic API calls from the API server for speed
3. **Marry them** — Port locked design into React components, wire to fast API layer
