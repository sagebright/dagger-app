---
name: generate-npcs
description: Generate Daggerheart narrative NPCs using Homebrew Kit creation order and structural validation. Auto-activates when user mentions creating, generating, or designing NPCs or characters.
activation:
  - user mentions creating or generating NPCs
  - user mentions designing a character or NPC
  - user says /generate-npcs
  - user asks to add friendly NPCs to the reference table
  - user asks to populate the daggerheart_npcs table
---

# Generate Daggerheart NPCs

Create narratively rich, story-driven NPCs for the `daggerheart_npcs` table. These are **reference NPCs** -- allies, quest-givers, bystanders, and narrative characters with optional lightweight mechanical features. Follows the Daggerheart Homebrew Kit creation philosophy with structural validation.

## Reference NPCs vs Adventure NPCs

This skill generates **reference NPCs** stored in `daggerheart_npcs`. These are reusable characters independent of any specific adventure.

**Reference NPCs** (`daggerheart_npcs` table):
- Standalone characters in the content database
- Tier-tagged for filtering by adventure difficulty
- Role-tagged for narrative function
- Optional mechanical features (trigger/effect/choice)
- Embedded for semantic search
- Created by this skill

**Adventure NPCs** (`NPC` / `CompiledNPC` in `content.ts`):
- Extracted from scene drafts during Inscribing phase
- Tied to specific adventure scenes via `sceneAppearances`
- Include `extractedFrom` context about which scenes reference them
- Managed by the `compile_npcs` MCP tool
- Not stored in Supabase -- live in adventure state

**Future consideration (out of scope):** A promotion workflow could allow adventure NPCs to be elevated into the reference table after an adventure is complete. This is not part of this skill.

## Creation Order

Execute these steps sequentially. Each step depends on the previous.

### Step 1: Tier + Role

Determine tier (1-4) and role. Tier sets the narrative complexity expectation -- higher-tier NPCs tend to have deeper motivations and more intricate connections. Role determines the character's narrative function in an adventure.

**Roles:**

| Role | Narrative Function | Example |
|------|-------------------|---------|
| ally | Actively helps the party; may join temporarily | A ranger who guides the party through cursed woods |
| neutral | Present in the world; interacts without taking sides | A merchant selling supplies at a crossroads |
| quest-giver | Provides hooks, missions, or information that drives action | An elder who begs the party to recover a stolen relic |
| antagonist | Opposes the party through social/political means (not combat) | A rival noble scheming to discredit the party |
| bystander | Affected by events; creates stakes and consequences | A farmer whose fields are being consumed by blight |

### Step 2: Name

Choose a name that fits the Daggerheart setting. Names should feel grounded but fantastical -- avoid Earth-culture-specific names. The name should hint at ancestry or region without requiring explanation.

### Step 3: Description

Write a 1-2 sentence description capturing who this person is and what makes them narratively interesting. This is the elevator pitch -- what a GM reads to decide whether to use this NPC.

### Step 4: Appearance

Write 2-3 sentences describing physical appearance. Focus on details a GM can convey at the table: silhouette, distinguishing marks, clothing, posture, and sensory details (how they sound, smell, or move). Painterly, evocative, specific.

### Step 5: Personality

Write 2-3 sentences describing how this character behaves and interacts. Focus on playable traits -- things a GM can perform at the table: speech patterns, emotional defaults, social habits, nervous tics. Make the personality something a GM can inhabit, not just describe.

### Step 6: Motivations

Write 2-4 motivations as a text array. Each motivation is a short phrase or sentence capturing what drives this character. Motivations should create potential tension or hooks for player interaction.

### Step 7: Connections

Write 2-4 connections as a text array. Each connection links the NPC to other characters, factions, locations, or events. Connections should be specific enough to generate story hooks but general enough to fit multiple adventures.

### Step 8: Notable Traits

Write 2-4 notable traits as a text array. These are distinctive quirks, habits, possessions, or abilities that make the NPC memorable and spark GM creativity. Each trait should be a gift to the GM, something they can riff on.

### Step 9: Features (Optional)

**Most NPCs should have zero features.** Features are reserved for NPCs whose narrative role requires mechanical interaction -- a healer who can restore HP, a trickster whose lies have game-mechanical consequences, a guardian whose protection has a cost.

If features are warranted, generate 1-2 features (maximum 2) using this pattern:

```json
{
  "name": "Feature Name",
  "trigger": "When [specific narrative/mechanical trigger]...",
  "effect": "...the NPC [mechanical effect with specific values].",
  "choice": "The player may choose to [optional player choice that adds depth]."
}
```

**Feature design rules:**
- `name`: Vivid, specific (e.g., "Grandmother's Remedy", "The Price of Truth")
- `trigger`: Clear condition -- when does this activate? (e.g., "When a PC shares a meal with Thessa...")
- `effect`: Concrete mechanical result with values appropriate to the NPC's tier
- `choice` (optional): A player-facing decision that adds narrative depth to the mechanical interaction

**When to include features:**
- The NPC's narrative role involves a recurring mechanical interaction
- The GM would benefit from structured guidance for the interaction
- The feature creates interesting player choices

**When to skip features:**
- The NPC is purely narrative (most cases)
- The NPC's interesting qualities are already captured in personality/traits
- Adding mechanics would make the NPC feel like an adversary stat block

## Batch Generation

Generate multiple NPCs per invocation. Default batch size is **5**. The user may request fewer (e.g., "generate 2 NPCs").

### Count

Ask the user how many NPCs to generate during the initial conversation. If unspecified, default to 5.

### Diversity Strategy

Auto-diversify **role** within the batch while keeping the user's chosen **tier** constant. Spread across roles to create a varied cast:

- If generating 5: aim for all 5 roles (ally, neutral, quest-giver, antagonist, bystander)
- If generating fewer: prioritize the most narratively useful roles (quest-giver, ally, antagonist)
- If the user specified a role, generate all entries with that role but vary personality, motivations, and connections
- Ensure each NPC has a distinct narrative identity -- no two NPCs in a batch should feel interchangeable

### Per-Entry Creation

Run the full 9-step creation order independently for each entry. Each NPC gets its own name, description, appearance, personality, motivations, connections, traits, and features. Ensure no duplicate names within the batch or against existing DB entries.

## Structural Invariants

These rules must hold for every generated NPC:

1. **Tier range:** Tier must be 1, 2, 3, or 4
2. **Valid role:** Role must be one of: ally, neutral, quest-giver, antagonist, bystander
3. **Name uniqueness:** No duplicate of existing NPC name in the database
4. **Description length:** 1-2 sentences
5. **Appearance length:** 2-3 sentences
6. **Personality length:** 2-3 sentences
7. **Motivations count:** 2-4 items
8. **Connections count:** 2-4 items
9. **Notable traits count:** 2-4 items
10. **Features limit:** 0-2 features; each feature must have name, trigger, and effect fields; choice is optional
11. **Source book:** Must be set to `'Generated'`

## Validation Checklist

Before presenting the NPC for review, verify all 11 items:

| # | Check | Rule |
|---|-------|------|
| 1 | Tier range | 1, 2, 3, or 4 |
| 2 | Valid role | One of: ally, neutral, quest-giver, antagonist, bystander |
| 3 | Name uniqueness | No duplicate in `daggerheart_npcs` table |
| 4 | Description length | 1-2 sentences |
| 5 | Appearance length | 2-3 sentences |
| 6 | Personality length | 2-3 sentences |
| 7 | Motivations count | 2-4 items |
| 8 | Connections count | 2-4 items |
| 9 | Notable traits count | 2-4 items |
| 10 | Feature constraints | 0-2 features; each has name + trigger + effect; choice optional |
| 11 | source_book | Set to `'Generated'` |

## Human Review Protocol

After generation and validation, present all NPCs for batch review.

### Present

1. **Summary table** of all entries:

| # | Name | Role | Tier | Features | Validation |
|---|------|------|------|----------|------------|
| 1 | ... | ... | ... | 0-2 | Pass/Fail |

2. **Full stat block** for each entry:
   - Name, tier, role
   - Description
   - Appearance
   - Personality
   - Motivations (bulleted list)
   - Connections (bulleted list)
   - Notable Traits (bulleted list)
   - Features (if any -- formatted with name, trigger, effect, choice)
3. **Validation checklist** results per entry (all 11 items, pass/fail)

### Options

- **Approve All** -- insert all entries
- **Approve Selected** -- specify entry numbers to insert (e.g., "approve 1, 3, 5")
- **Revise** -- specify entry number and which fields to change; re-validate after
- **Reject** -- specify entries to discard

## Insert Workflow

After human approval, insert each approved NPC into the database. Repeat steps 1-3 for each approved entry.

### Step 1: Compute searchable_text

Concatenate for full-text search:

```
searchable_text = name + ' ' + role + ' ' + description + ' ' + appearance + ' ' + personality + ' ' + motivations.join(' ') + ' ' + connections.join(' ') + ' ' + notable_traits.join(' ')
```

### Step 2: Generate Embedding

Call the `embed` Edge Function to generate the embedding vector:

```sql
-- Via Supabase Edge Function (not direct SQL)
-- POST to: {SUPABASE_URL}/functions/v1/embed
-- Body: { "input": searchable_text }
-- Returns: { "embedding": [float array] }
```

### Step 3: Insert via execute_sql

Use `execute_sql` (not `apply_migration` -- this is content data, not schema):

```sql
INSERT INTO daggerheart_npcs (
  name, tier, role, description,
  appearance, personality,
  motivations, connections, notable_traits,
  features,
  searchable_text, embedding, source_book
) VALUES (
  'NPC NAME',
  1,                                    -- tier
  'ally',                               -- role
  'Description text...',                -- description
  'Appearance text...',                 -- appearance
  'Personality text...',                -- personality
  ARRAY['Motivation 1', 'Motivation 2'],
  ARRAY['Connection 1', 'Connection 2'],
  ARRAY['Trait 1', 'Trait 2'],
  ARRAY['{"name":"Feature Name","trigger":"When...","effect":"...","choice":"..."}'::jsonb],
  'computed searchable text...',        -- searchable_text
  '[embedding vector]'::vector,         -- embedding
  'Generated'                           -- source_book
);
```

**Note:** If the NPC has no features, use `'{}'::jsonb[]` for the features column (empty array, matching the table default).

### Step 4: Report Results

After all approved entries are inserted, present a summary:

| # | Name | Status |
|---|------|--------|
| 1 | ... | Inserted / Skipped / Failed |

## Exemplar Query

Pull a real NPC as a structural reference (once the table is populated):

```sql
SELECT name, tier, role, description, appearance, personality,
       motivations, connections, notable_traits, features
FROM daggerheart_npcs
WHERE source_book = 'Generated'
ORDER BY created_at DESC
LIMIT 1;
```

## Name Uniqueness Check

Before finalizing, verify the name is not already in use:

```sql
SELECT COUNT(*) FROM daggerheart_npcs WHERE LOWER(name) = LOWER('Proposed Name');
```
