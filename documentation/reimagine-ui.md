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

A muted pill badge for scene association on content entries across stages 6–9. Deliberately NOT gold — scene badges are informational metadata, not interactive highlights.

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

Used in: NPC cards (Conjuring), adversary cards (Summoning), loot items (Enchanting), echo entries (Scrying). Scene selector filter tabs use the same "Scene N" label format for consistency.

## Strategic Path

1. **Lock the atmosphere** — HTML mockup iteration on component tuning page
2. **Bring the engine to life** — Replace MCP bridge with direct Anthropic API calls for speed
3. **Marry them** — Port locked design into React components, wire to fast API layer
