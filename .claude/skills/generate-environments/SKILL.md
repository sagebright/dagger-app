---
name: generate-environments
description: Generate Daggerheart environments using Homebrew Kit creation order, Improvised Statistics, Sullivan Torch narrative voice, and structural validation. Auto-activates when user mentions creating, generating, or designing environments.
activation:
  - user mentions creating or generating environments
  - user mentions designing an environment stat block
  - user says /generate-environments
  - user asks to fill environment coverage gaps
---

# Generate Daggerheart Environments

Create mechanically sound, narratively rich environments for the `daggerheart_environments` table. Follows the Daggerheart Homebrew Kit v1.0 creation order with Sullivan Torch narrative voice.

## Creation Order

Execute these steps sequentially. Each step depends on the previous.

### Step 1: Tier + Difficulty

Determine tier (1-4) and difficulty from Improvised Statistics table (see below). Difficulty sets the baseline for feature thresholds and damage dice.

### Step 2: Type

Choose one: **Exploration** | **Social** | **Traversal** | **Event**

| Type | Focus | Example |
|------|-------|---------|
| Exploration | Discovering, investigating, navigating unknown spaces | Fungal Cavern, Sunken Ruin |
| Social | Negotiation, intrigue, relationships, politics | Imperial Court, Outpost Town |
| Traversal | Movement through hazardous terrain, journey-focused | Blighted Mire, Mountain Pass |
| Event | Time-bound occurrences, festivals, battles, rituals | Siege, Harvest Festival |

### Step 3: Impulses

Write 2 impulses (text[] array). These are the environment's behavioral drives -- what it "wants" to do to the PCs. Use active, threatening verbs.

**Pattern from SRD:** `"Drive the desperate to certain doom"`, `"seduce rivals with promises of power and comfort"`, `"Justify and perpetuate imperial rule"`

### Step 4: Features (with Throughline)

Generate 3-6 features as JSONB array. Each feature object:

```json
{
  "name": "Feature Name",
  "desc": "Mechanical description with roll types, outcomes, and consequences.",
  "type": "Passive | Action | Reaction",
  "fear_cost": 0,
  "gm_questions": ["Evocative question for the GM?", "Second question?"]
}
```

**Feature Ordering Rules:**
1. Passive features first, then Action, then Reaction
2. Categories may be omitted (HALLOWED TEMPLE has no Actions; ABANDONED GROVE has no Reactions)
3. Minimum 3 features, maximum 6
4. At least 1 feature must have `fear_cost >= 1`

**Feature Counts by Tier:**

| Tier | Typical Features | Passives | Actions | Reactions |
|------|-----------------|----------|---------|-----------|
| 1 | 3-5 | 2-3 | 0-1 | 1-2 |
| 2 | 4-5 | 2-3 | 0-2 | 1-2 |
| 3 | 4-6 | 2-3 | 1-2 | 1-2 |
| 4 | 5-6 | 2-3 | 1-2 | 1-2 |

**Fear Costs:**
- Passive features: always `fear_cost: 0`
- Action features: `fear_cost: 0` or `fear_cost: 1` (spend a Fear to activate)
- Reaction features: `fear_cost: 0` or `fear_cost: 1` (triggered on results with Fear)

**Asymmetric Design:** Environments are adversarial -- they challenge PCs. Features should pressure, tempt, threaten, or constrain. Even "helpful" features (like A Place of Healing) come with conditions or trade-offs.

**Throughline:** After writing features, compose a 1-2 sentence `throughline` (stored in `throughline` column) that captures the dramatic question the environment poses. This is the narrative thread connecting all features.

Example: "Can the party resist the gravitational pull of imperial power long enough to accomplish their mission, or will the court's seductions compromise their purpose?"

### Step 5: Potential Adversaries

List 3-6 adversary names (text[] array) appropriate for the tier and type. These are suggestions, not strict requirements.

**Soft validation only:** Check that adversary names plausibly exist at this tier. Do NOT validate against the adversaries table row-by-row -- generated environments may reference adversaries not yet in the DB.

### Step 6: Description

Write a 2-4 sentence description. This is the environment's "read-aloud" text -- evocative, sensory, and atmospheric. Apply Sullivan Torch voice (see below).

## Improvised Statistics by Tier

Reference table from Daggerheart Homebrew Kit v1.0 pp.3-4, 15, 18-20.

| Tier | Difficulty | Damage Dice | Thresholds (Minor/Major/Severe) | HP Range | Stress |
|------|-----------|-------------|--------------------------------|----------|--------|
| 1 | 10-13 | d6-d8 | 3/7/13 | 4-8 | 2-3 |
| 2 | 12-16 | d8-d10 | 5/11/17 | 6-14 | 3-5 |
| 3 | 15-19 | d10-d12 | 7/15/21 | 10-20 | 4-6 |
| 4 | 18-23 | d12-d20 | 9/19/27 | 14-30 | 5-8 |

**Note:** Environment difficulty values for features that require rolls should reference the difficulty column (not thresholds, which are for adversaries). Use damage dice when a feature deals damage.

## Structural Invariants

These rules must hold for every generated environment:

1. **Feature ordering:** Passive -> Action -> Reaction (categories may be omitted, never reordered)
2. **Feature counts:** 3-6 features per environment
3. **Fear cost rules:** Passives = 0; Actions/Reactions = 0 or 1
4. **Impulse count:** Exactly 2 impulses
5. **Description length:** 2-4 sentences
6. **Adversary format:** Array of name strings, 3-6 entries
7. **Type:** One of Exploration, Social, Traversal, Event
8. **Tier + Difficulty alignment:** Difficulty must fall within the Improvised Statistics range for the tier
9. **PC-targeting:** Features target PCs, not NPCs or abstract entities
10. **Throughline coherence:** Throughline reflects the dramatic tension created by the features

## Sullivan Torch Integration

Pull the Sullivan Torch narrative profile at runtime to inject voice into generated prose.

### SQL Query

```sql
SELECT personality, character, signature
FROM sage_profiles
WHERE slug = 'sullivan-torch';
```

### Profile Structure

- `personality` (jsonb): Humor, Pacing, Warmth, Guidance, Vitality, Authority, Curiosity, Formality, Elaboration, Adaptiveness, Tension Style -- each with label and score
- `character` (jsonb): Description, Expertise, Voice Snippet, Meta-Instructions, Narrative Texture, Priorities & Values, Use Case
- `signature` (jsonb): key_phrases, anti_patterns, verbal_texture, conceptual_anchors, conversational_moves, rhetorical_structure

### Voice Application

Apply Sullivan Torch voice to these fields:
- **description**: Sensory, expansive, inviting -- makes the GM want to read it aloud
- **impulses**: Active, threatening, but with narrative flair
- **feature gm_questions**: Evocative, player-focused, open-ended -- the kind of question that makes a GM pause and think
- **feature names**: Vivid, specific, occasionally playful (e.g., "It'd Be a Shame If Something Happened to Your Store")
- **throughline**: Frames the dramatic question with warmth and stakes

### Key Voice Principles (from Meta-Instructions)

- Start from specific, vivid examples -- build toward principles
- Use humor as a bridge to depth
- Frame storytelling as an act of service
- Never gatekeep; celebrate the questioner's instincts
- Reference broadly (improv, mythology, psychology)
- Enthusiastic and generous, never condescending

## Validation Checklist

Before presenting the environment for review, verify all 13 items:

| # | Check | Rule |
|---|-------|------|
| 1 | Feature ordering | Passive -> Action -> Reaction (no reordering) |
| 2 | Difficulty range | Within Improvised Statistics bounds for tier |
| 3 | Damage dice | Any damage in features uses tier-appropriate dice |
| 4 | Impulse count | Exactly 2 impulses |
| 5 | Description length | 2-4 sentences |
| 6 | Adversary format | Array of 3-6 name strings (soft check -- names plausible for tier) |
| 7 | Feature fields | Every feature has: name, desc, type, fear_cost, gm_questions |
| 8 | Feature types | Each type is Passive, Action, or Reaction |
| 9 | source_book | Set to `'Generated'` |
| 10 | Name uniqueness | No duplicate of existing environment name in DB |
| 11 | Throughline coherence | Throughline reflects the dramatic tension of the features |
| 12 | PC-targeting | Features target PCs, not abstract entities |
| 13 | Fear-cost appropriateness | Passives = 0; at least 1 feature with fear_cost >= 1 |

## Human Review Protocol

After generation and validation, present the environment for human review.

### Present

1. **Stat block** as formatted JSON (name, tier, type, difficulty, impulses, features, potential_adversaries, description, throughline)
2. **Throughline** highlighted separately for narrative review
3. **Validation checklist** results (all 13 items, pass/fail)

### Options

- **Approve** -- proceed to insert workflow
- **Request revision** -- specify which fields to revise; re-run validation after changes
- **Reject** -- discard and optionally restart with different parameters

## Insert Workflow

After human approval, insert the environment into the database.

### Step 1: Compute searchable_text

Concatenate for full-text search:

```
searchable_text = name + ' ' + description + ' ' + impulses.join(' ') + ' ' + features.map(f => f.name + ' ' + f.desc + ' ' + f.gm_questions.join(' ')).join(' ')
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
INSERT INTO daggerheart_environments (
  name, tier, type, description, impulses, difficulty,
  potential_adversaries, features, throughline,
  searchable_text, embedding, source_book
) VALUES (
  'ENVIRONMENT NAME',
  1,                              -- tier
  'Exploration',                  -- type
  'Description text...',          -- description
  ARRAY['Impulse 1', 'Impulse 2'],
  12,                             -- difficulty
  ARRAY['Adversary 1', 'Adversary 2', 'Adversary 3'],
  $features_json$::jsonb[],      -- features array
  'Throughline text...',          -- throughline
  'computed searchable text...',  -- searchable_text
  '[embedding vector]'::vector,   -- embedding
  'Generated'                     -- source_book
);
```

## Coverage Gaps (Current)

Query to check current coverage:

```sql
SELECT tier, type, COUNT(*) as count
FROM daggerheart_environments
GROUP BY tier, type
ORDER BY tier, type;
```

**Priority gaps to fill:**
- Social T3: 0 environments
- Traversal T3: 0 environments
- All T2 types: only 1 each
- All T3 types: 0-2 each

## Exemplar Query

Pull a real environment as a structural reference:

```sql
SELECT name, tier, type, difficulty, impulses, features, throughline, description, potential_adversaries
FROM daggerheart_environments
WHERE source_book = 'Daggerheart Core Rulebook'
ORDER BY tier, type
LIMIT 1;
```
