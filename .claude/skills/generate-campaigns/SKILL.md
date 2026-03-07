---
name: generate-campaigns
description: Use when user mentions creating, generating, or designing Daggerheart campaigns, says /generate-campaigns, or asks to build a campaign from a frame. Generates campaign shells bound to frames with arcs, factions, NPCs, and session hooks.
---

# Generate Daggerheart Campaign Shells

Create structured campaign documents bound to existing frames from the `daggerheart_frames` table. Campaigns are exported as markdown -- no database persistence in v1. Database persistence will be added once generation quality is validated through use.

## Creation Order

Execute these 9 steps sequentially. Each step builds on the previous.

### Step 1: Frame Selection

Query `daggerheart_frames` and select an existing frame to anchor the campaign. The frame provides the world, themes, and tone that all downstream content must respect.

**Process:**
1. Ask the user which frame to use, or list available frames via query
2. Load the frame's themes, tone_feel, inciting_incident, and distinctions
3. All subsequent steps must align with the frame's established identity

**If the user wants a frame that doesn't exist yet:** Direct them to `/generate-frames` first, then return to this skill.

### Step 2: Campaign Title

Choose a concise, evocative title for the campaign. Must be distinct from the frame title.

**Constraints:** 1-6 words. Unique within the batch.

**Examples:** "Crown of Fractures", "The Long Thaw", "Ashes and Accord"

### Step 3: Campaign Concept

Write a single sentence that captures what makes THIS campaign unique within the frame's world. This is not the frame's concept -- it is the campaign-specific elevator pitch.

**Constraints:** Exactly 1 sentence. Distinct from the frame's concept.

### Step 4: Tier Progression

Define the campaign's power arc.

**Format:**
```json
{
  "tier_start": 1,
  "tier_end": 3,
  "session_count": 12
}
```

**Constraints:**
- `tier_start`: Integer 1-4
- `tier_end`: Integer 1-4, must be >= tier_start
- `session_count`: Approximate number of sessions (optional but recommended)

### Step 5: Campaign Arcs

Define 2-4 narrative arcs. Each arc represents a major storyline that spans multiple sessions.

**Format:** JSON array of objects:

```json
[
  {
    "name": "Arc Name",
    "description": "2-3 sentences describing the arc.",
    "dramatic_question": "The question this arc asks.",
    "tier_range": "1-2"
  }
]
```

**Constraints:**
- 2-4 arcs per campaign
- Each arc has a name, description (2-3 sentences), dramatic_question (1 sentence ending in ?), and tier_range
- Arcs should interleave -- no arc should be fully independent of all others
- At least one arc must span the full tier range of the campaign

### Step 6: Factions

Define 3-5 factions with clear goals and relationships.

**Format:** JSON array of objects:

```json
[
  {
    "name": "Faction Name",
    "goals": "What the faction wants.",
    "methods": "How they pursue their goals.",
    "disposition": "neutral",
    "relationships": "How this faction relates to 1-2 other factions."
  }
]
```

**Constraints:**
- 3-5 factions per campaign
- `disposition`: one of `allied` | `neutral` | `suspicious` | `hostile` (toward PCs at campaign start)
- `relationships`: Must reference at least 1 other faction by name
- Factions should create tension -- at least 2 factions must have conflicting goals

### Step 7: Key NPCs

Define 4-8 lightweight NPC entries. These are narrative hooks, not full character sheets -- use `/generate-npcs` for detailed NPC generation.

**Format:** JSON array of objects:

```json
[
  {
    "name": "NPC Name",
    "role": "quest giver",
    "faction": "Faction Name",
    "hook": "Why PCs would interact with them.",
    "arc_tie": "Arc Name"
  }
]
```

**Constraints:**
- 4-8 NPCs per campaign
- `role`: brief descriptor (e.g., "quest giver", "antagonist", "guide", "informant", "rival")
- `faction`: name of a faction from Step 6, or "unaffiliated"
- `hook`: exactly 1 sentence
- `arc_tie`: name of an arc from Step 5
- At least one NPC per faction

**Do NOT generate:** stat blocks, appearance descriptions, personality traits, backstory paragraphs, or dramatic tension descriptions. Those belong in `/generate-npcs`.

### Step 8: Session Hooks

Define 6-10 session starters tied to campaign arcs.

**Format:** JSON array of objects:

```json
[
  {
    "hook": "1-2 sentence scenario that opens a session.",
    "arc": "Arc Name",
    "tier": 1
  }
]
```

**Constraints:**
- 6-10 hooks per campaign
- `hook`: 1-2 sentences, specific and actionable
- `arc`: name of an arc from Step 5
- `tier`: integer matching the campaign's tier range
- Spread hooks across all arcs (no arc without at least 1 hook)
- Spread hooks across all tiers in the campaign's range

### Step 9: Escalation Triggers

Define 3-5 world events that fire if PCs don't intervene. These create urgency and consequences for inaction.

**Format:** JSON array of objects:

```json
[
  {
    "trigger": "What causes this event.",
    "consequence": "What happens to the world.",
    "arc": "Arc Name"
  }
]
```

**Constraints:**
- 3-5 triggers per campaign
- `trigger`: 1 sentence describing the condition
- `consequence`: 1-2 sentences describing the world-state change
- `arc`: name of an arc from Step 5
- Each trigger should meaningfully change the campaign's landscape if it fires

## Batch Generation

Default **3** campaigns per batch. The user may request fewer.

### Diversity Strategy

- Vary tier progression across the batch (e.g., one short Tier 1-2, one full Tier 1-4)
- Vary faction dynamics (political, military, religious, economic)
- Each campaign should answer different dramatic questions
- If user specifies a frame, all campaigns share it but diverge in arcs/factions

### Per-Entry Creation

Run the full 9-step creation order independently for each entry.

## Structural Invariants

| # | Check | Rule |
|---|-------|------|
| 1 | Title | 1-6 words, unique within batch |
| 2 | Concept | Exactly 1 sentence |
| 3 | Tier range | Start and end both 1-4, end >= start |
| 4 | Arc count | 2-4 arcs, each with name/description/dramatic_question/tier_range |
| 5 | Faction count | 3-5 factions, each with name/goals/disposition/relationships |
| 6 | NPC count | 4-8 NPCs, each with name/role/hook/arc_tie |
| 7 | Hook count | 6-10 hooks, each tied to an arc |
| 8 | Escalation count | 3-5 triggers, each with trigger/consequence/arc |
| 9 | Frame reference | Must reference a valid frame from `daggerheart_frames` |

## Validation Checklist

Before presenting for review, verify all 9 items:

| # | Check | Rule |
|---|-------|------|
| 1 | Title | 1-6 words, unique within batch, distinct from frame title |
| 2 | Concept | Exactly 1 sentence, distinct from frame concept |
| 3 | Tier range | Start 1-4, end 1-4, end >= start |
| 4 | Arcs | 2-4, each with all required fields, at least one spanning full tier range |
| 5 | Factions | 3-5, dispositions use enum values, at least 2 have conflicting goals |
| 6 | NPCs | 4-8, lightweight (no stat blocks), at least 1 per faction |
| 7 | Hooks | 6-10, spread across all arcs and tiers |
| 8 | Escalations | 3-5, each with meaningful consequence |
| 9 | Frame | References valid frame, all content aligns with frame themes |

## Human Review Protocol

After generation and validation, present campaigns for review.

### Present

1. **Summary table:**

| # | Title | Frame | Tiers | Arcs | Factions | Validation |
|---|-------|-------|-------|------|----------|------------|
| 1 | ... | ... | 1-3 | 3 | 4 | Pass/Fail |

2. **Full campaign** as formatted markdown (see Export Format below)
3. **Validation checklist** results (all 9 items, pass/fail)

### Options

- **Approve All** -- export all campaigns as markdown
- **Approve Selected** -- specify campaign numbers
- **Revise** -- specify campaign number and which steps to redo
- **Reject** -- discard

## Export Format

Export each approved campaign as a formatted markdown document:

```markdown
# [Campaign Title]

**Frame:** [Frame Name]
**Concept:** [One sentence]
**Tiers:** [start] - [end] (~[session_count] sessions)

## Arcs

### [Arc Name] (Tier [range])
[Description]
**Dramatic Question:** [question]

## Factions

### [Faction Name]
- **Goals:** [goals]
- **Methods:** [methods]
- **Disposition:** [disposition]
- **Relationships:** [relationships]

## Key NPCs

| Name | Role | Faction | Arc | Hook |
|------|------|---------|-----|------|
| ... | ... | ... | ... | ... |

## Session Hooks

| # | Hook | Arc | Tier |
|---|------|-----|------|
| 1 | ... | ... | ... |

## Escalation Triggers

| Trigger | Consequence | Arc |
|---------|-------------|-----|
| ... | ... | ... |
```

## Future: Database Schema

```sql
-- NOT YET IMPLEMENTED -- reference schema for future persistence
CREATE TABLE daggerheart_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  frame_id UUID REFERENCES daggerheart_frames(id),
  title TEXT NOT NULL,
  concept TEXT NOT NULL,
  tier_start INTEGER NOT NULL CHECK (tier_start BETWEEN 1 AND 4),
  tier_end INTEGER NOT NULL CHECK (tier_end BETWEEN 1 AND 4),
  session_count INTEGER,
  arcs JSONB NOT NULL DEFAULT '[]',
  factions JSONB NOT NULL DEFAULT '[]',
  key_npcs JSONB NOT NULL DEFAULT '[]',
  session_hooks JSONB NOT NULL DEFAULT '[]',
  escalation_triggers JSONB NOT NULL DEFAULT '[]',
  source TEXT DEFAULT 'sage',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
