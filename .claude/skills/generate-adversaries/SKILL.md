---
name: generate-adversaries
description: Generate Daggerheart adversaries using Homebrew Kit creation order (pp 15-17), Improvised Statistics, asymmetric design principles, Sullivan Torch narrative voice, and structural validation. Auto-activates when user mentions creating, generating, or designing adversaries, enemies, or monsters.
activation:
  - user mentions creating or generating adversaries
  - user mentions designing an adversary or enemy stat block
  - user mentions creating or generating enemies or monsters
  - user says /generate-adversaries
  - user asks to add adversaries to the reference table
  - user asks to populate the daggerheart_adversaries table
---

# Generate Daggerheart Adversaries

Create mechanically sound, narratively rich adversaries for the `daggerheart_adversaries` table. Follows the Daggerheart Homebrew Kit v1.0 creation order (pp 15-17) with Sullivan Torch narrative voice. This is the most mechanically complex content type in Daggerheart -- adversaries have full stat blocks with HP, stress, thresholds, attack modifiers, damage dice, features, and experiences.

## Creation Order

Execute these 11 steps sequentially. Each step depends on the previous.

### Step 1: Tier

Choose tier 1-4. Tier determines the baseline difficulty, damage output, and mechanical complexity of the adversary. Higher tiers mean deadlier stats across the board.

| Tier | Power Level | Typical Context |
|------|------------|-----------------|
| 1 | Fledgling threats | Starting adventures, early encounters |
| 2 | Established dangers | Mid-level campaigns, meaningful opposition |
| 3 | Formidable foes | High-stakes encounters, regional threats |
| 4 | Legendary terrors | Campaign-climax encounters, world-shaping threats |

### Step 2: Type

Choose the adversary's combat role. Type determines HP range, damage output, feature count, and tactical behavior.

| Type | Combat Role | Key Traits |
|------|------------|------------|
| Standard | Balanced combatant | Versatile, moderate HP and damage |
| Solo | Single powerful foe for full-party encounters | High HP, multiple features, acts multiple times |
| Leader | Commands other adversaries, buffs allies | Moderate HP, command/buff features |
| Bruiser | Hits hard, absorbs punishment | High HP, high damage dice |
| Horde (N/HP) | Swarm of creatures acting as one unit | Uses N/HP notation (e.g., "Horde (3/HP)"), group mechanics |
| Minion | Disposable fodder, dies in one hit | HP = 1 (or 2 for tougher minions), flat damage, 1-2 features |
| Skulk | Ambush predator, hit-and-run | Moderate HP, evasion/stealth features |
| Social | Opposes through words, not weapons | Low HP, social manipulation features, low damage |
| Support | Heals or buffs other adversaries | Low-moderate HP, support features, low damage |
| Ranged | Attacks from distance, avoids melee | Moderate HP, ranged attack features |

**Horde notation:** Hordes use a special type format: `"Horde (N/HP)"` where N is the number of individuals. For example, `"Horde (3/HP)"` means a group of 3 creatures, each with their own HP. The skill must preserve this notation format.

### Step 3: Difficulty

Set the adversary's difficulty rating from the Improvised Statistics table (see below). Difficulty is the target number PCs roll against. Allow a range of tier baseline plus or minus 3 to accommodate easier or harder variants.

### Step 4: HP

Set hit points appropriate to the adversary's type and tier.

**HP Guidelines by Type:**

| Type | HP Range | Notes |
|------|----------|-------|
| Minion | 1 | Always 1; tougher minion variant = 2 |
| Social | 3-5 | Falls quickly if pressed to combat |
| Support | 3-6 | Not meant to survive focused assault |
| Skulk | 3-5 | Relies on evasion, not endurance |
| Ranged | 4-6 | Moderate; kept alive by distance |
| Standard | 4-6 | Baseline durability |
| Leader | 5-8 | Slightly tougher; needs to survive to command |
| Bruiser | 7-10 | Designed to absorb punishment |
| Horde (N/HP) | 2-4 per member | Each individual has own HP; N members |
| Solo | 7-12+ | Must survive sustained focus from full party |

**Tier adjustments:** Add 0-2 HP at tier 2, 2-4 at tier 3, 4-6 at tier 4 to the base ranges above.

### Step 5: Stress

Set stress (the adversary's resource for activating fear-costing features). Range: 2-6.

| Type | Typical Stress |
|------|---------------|
| Minion | 2 |
| Standard / Skulk / Ranged | 2-3 |
| Social / Support | 2-4 |
| Leader | 3-5 |
| Bruiser | 3-4 |
| Solo | 4-6 |

### Step 6: Thresholds

Set damage thresholds as a string in the format `"Minor N / Major N / Severe N"`.

**Thresholds by Tier (from Improvised Statistics):**

| Tier | Minor | Major | Severe |
|------|-------|-------|--------|
| 1 | 3 | 7 | 13 |
| 2 | 5 | 11 | 17 |
| 3 | 7 | 15 | 21 |
| 4 | 9 | 19 | 27 |

Store as a single string, e.g. `"Minor 5 / Major 11 / Severe 17"`.

### Step 7: ATK + Weapon + Range + Damage

Set the adversary's attack profile.

**ATK Modifier:** Follows the Improvised Statistics baseline for the tier, plus or minus 4 to allow for weaker or stronger attackers.

| Tier | ATK Baseline | Allowed Range |
|------|-------------|---------------|
| 1 | +2 | -2 to +6 |
| 2 | +4 | +0 to +8 |
| 3 | +6 | +2 to +10 |
| 4 | +9 | +5 to +13 |

**ATK format:** String with modifier and any special notes, e.g. `"+4 (Melee)"`, `"+6 (Ranged, Magical)"`.

**Weapon:** Descriptive name of the adversary's weapon or attack method, e.g. `"Rusted Greatsword"`, `"Venomous Bite"`, `"Eldritch Bolt"`.

**Range:** One of `"Melee"`, `"Ranged"`, `"Very Close"`, `"Close"`, `"Far"`, `"Very Far"`.

**Damage Dice by Type:**

| Type | Damage Dice | Notes |
|------|------------|-------|
| Minion | Flat damage (no dice) | e.g., "2 damage", "3 damage" |
| Social | d4-d6 | Combat is not their strength |
| Support | d4-d6 | Focused on helping allies, not dealing damage |
| Skulk | d6-d8 | Moderate; relies on surprise, not raw power |
| Ranged | d6-d10 | Moderate to high; compensates for vulnerability |
| Standard | d6-d8 | Baseline damage |
| Leader | d6-d8 | Moderate; power comes from commanding others |
| Bruiser | d10-d12 | Highest non-solo damage |
| Solo | d10-d12 | Heavy hitter with sustained output |
| Horde (N/HP) | d6-d8 per member | Individual damage is moderate; volume is the threat |

**Tier adjustments for damage dice:** Step up one die size at tier 3 and again at tier 4. A tier 4 Bruiser might deal 2d12+4 instead of d10.

**Damage format:** String with dice expression, e.g. `"2d8+2"`, `"d10+4"`, `"3 damage"` (for minions).

### Step 8: Motives and Tactics

Write 2-3 motives/tactics as a text array. These describe what drives the adversary in combat and how it behaves tactically. Use active verbs with narrative flair. Apply Sullivan Torch voice.

**Pattern:** Each motive/tactic should answer "What does this creature want?" or "How does it fight?"

**Examples:**
- `"Hunts in packs, circling wounded prey before closing in for the kill"`
- `"Protects the hive at any cost, throwing itself between threats and the queen"`
- `"Toys with its victims, savoring their fear before striking the final blow"`

### Step 9: Experiences

Generate experiences as a JSONB object mapping skill names to modifier strings.

**Format:** `{ "Skill Name": "+N" }`

**Guidelines:**
- 2-4 experiences per adversary
- Modifier range: +1 to +4 (higher at higher tiers)
- Choose skills that reflect the adversary's nature and tactics
- Common adversary skills: Intimidation, Stealth, Perception, Athletics, Deception, Nature, Arcana, Survival

**Examples:**
```json
{ "Intimidation": "+3", "Athletics": "+2", "Perception": "+2" }
{ "Stealth": "+4", "Deception": "+3", "Perception": "+2" }
{ "Arcana": "+3", "Intimidation": "+2" }
```

**Note:** All 129 existing adversaries in the database have empty `{}` experiences. This skill generates proper experiences for new adversaries only -- no backfill of existing records.

### Step 10: Features

Generate features as a JSONB array. Each feature object:

```json
{
  "name": "Feature Name",
  "desc": "Mechanical description with specific triggers, effects, and values.",
  "type": "Passive | Action | Reaction"
}
```

**Feature Ordering Rules:**
1. Passive features first, then Action, then Reaction
2. Categories may be omitted (an adversary could have only Passives and Reactions)
3. Never reorder -- Passive always precedes Action, which always precedes Reaction

**Feature Counts by Type:**

| Adversary Type | Feature Count | Notes |
|----------------|--------------|-------|
| Minion | 1-2 | Keep it simple; minions die fast |
| Standard | 2-3 | Core combat identity in 2-3 features |
| Skulk | 2-3 | Evasion + ambush features |
| Ranged | 2-3 | Range control + distance features |
| Social | 2-3 | Manipulation + social features |
| Support | 2-3 | Buff/heal + support features |
| Leader | 3-4 | Command + buff + personal combat |
| Bruiser | 2-3 | Damage + resilience features |
| Solo | 3-5 | Must have enough features to threaten a full party |

**Key Feature Patterns (from SRD and existing adversaries):**

| Pattern | Type | Description |
|---------|------|-------------|
| Momentum | Reaction | Triggered when the adversary takes a certain amount of damage or stress; escalates the fight |
| Relentless (X) | Passive | Adversary can take X additional actions per round; critical for Solos and Leaders |
| Terrifying | Passive | Forces fear-related effects when PCs first encounter the adversary |
| Slow | Passive | Adversary takes fewer actions; balances high damage or HP |
| Multiattack | Action | Adversary makes multiple attacks in a single action |
| Aura / Presence | Passive | Ongoing effect in an area around the adversary |

**Feature Design Principles:**
- Features should be memorable and create tactical puzzles for players
- Each feature should change how players approach the encounter
- Avoid features that are just "deal more damage" -- add conditions, choices, or consequences
- Name features vividly (e.g., "Unquenchable Hunger", "The Weight of Command", "Spite-Touched Claws")

### Step 11: Description

Write a 2-4 sentence description. This is the adversary's "read-aloud" text -- what the GM narrates when the party first encounters the creature. Apply Sullivan Torch voice: make the adversary feel alive and dangerous, not like a stat block with flavor text.

## Improvised Statistics by Tier

Reference table from Daggerheart Homebrew Kit v1.0 pp 15-17.

| Tier | Difficulty | ATK Modifier | Damage Dice | Thresholds (Minor/Major/Severe) | HP Range | Stress |
|------|-----------|-------------|-------------|--------------------------------|----------|--------|
| 1 | 10-13 | +2 | d6-d8 | 3/7/13 | 4-8 | 2-3 |
| 2 | 12-16 | +4 | d8-d10 | 5/11/17 | 6-14 | 3-5 |
| 3 | 15-19 | +6 | d10-d12 | 7/15/21 | 10-20 | 4-6 |
| 4 | 18-23 | +9 | d12-d20 | 9/19/27 | 14-30 | 5-8 |

**Difficulty tolerance:** Generated adversaries may deviate by up to 3 from the tier range (e.g., a tier 1 adversary could have difficulty 7-16).

## Adversary Types Reference

Verified from live database (129 adversaries). Types include:

- Standard
- Solo
- Leader
- Bruiser
- Horde (N/HP) -- includes HP notation in the type field, e.g., `"Horde (3/HP)"`
- Minion
- Skulk
- Social
- Support
- Ranged

## Asymmetric Design Rules

Daggerheart adversaries follow asymmetric design -- they do not use the same mechanics as PCs. These rules are critical for balanced, interesting encounters.

### Rule 1: Features Target PCs, Not Adversary Stats

Adversary features affect PCs and the fiction, not the adversary's own statistics. Features should create problems for players to solve, not buff the adversary's numbers.

**Do:**
- "When a PC fails a roll within Close range, they are knocked Prone"
- "PCs within Very Close range must mark Stress at the start of their turn"
- "When a PC deals damage to the Hollow Knight, the attacker marks 1 Stress"

**Do not:**
- "The adversary gains +2 to its ATK modifier" (buffing own stats)
- "The adversary heals 3 HP when it deals damage" (self-healing loops)
- "The adversary's difficulty increases by 2" (modifying own difficulty)

### Rule 2: Fear-Costing Features Do Not Generate Fear

Features that cost Fear (stress spent by the GM) must NOT also generate Fear. This prevents positive feedback loops where spending Fear generates more Fear.

**Do:**
- "Spend 1 Fear: Each PC within Close range must make a Presence roll or become Frightened"
- "Spend 2 Fear: The adversary immediately takes an additional action"

**Do not:**
- "Spend 1 Fear: Deal 2d8 damage and generate 1 Fear" (spending Fear to gain Fear)
- "Spend 1 Fear: All PCs mark 1 Stress and the GM marks 1 Fear" (Fear feedback loop)

### Rule 3: Adversaries Are Not PCs

Adversaries do not have:
- Evasion scores (PCs roll against difficulty, not evasion)
- Hope (that is a PC resource)
- Armor scores (they have HP and thresholds)
- Spell slots or domain cards

## Structural Invariants

These 13 rules must hold for every generated adversary:

| # | Invariant | Rule |
|---|-----------|------|
| 1 | Tier range | Tier must be 1, 2, 3, or 4 |
| 2 | Valid type | Type must be one of: Standard, Solo, Leader, Bruiser, Horde (N/HP), Minion, Skulk, Social, Support, Ranged |
| 3 | Difficulty range | Within Improvised Statistics bounds for tier, plus or minus 3 |
| 4 | HP appropriate | HP falls within the guidelines for the adversary type and tier |
| 5 | Stress range | Stress between 2 and 6 |
| 6 | Threshold format | String format: `"Minor N / Major N / Severe N"` with values from Improvised Statistics |
| 7 | ATK format and range | ATK modifier string within tier baseline plus or minus 4 |
| 8 | Damage dice match tier | Damage dice appropriate to type and tier per guidelines |
| 9 | Motives count | 2-3 motives/tactics |
| 10 | Feature ordering and counts | Passive before Action before Reaction; count within type guidelines |
| 11 | PC-targeting | Features target PCs, not adversary stats |
| 12 | No fear feedback loops | Fear-costing features do not generate Fear |
| 13 | Name uniqueness + source_book | Name is unique in `daggerheart_adversaries`; source_book = `'Generated'` |

## Validation Checklist

Before presenting the adversary for review, verify all 13 items:

| # | Check | Rule |
|---|-------|------|
| 1 | Tier range | 1, 2, 3, or 4 |
| 2 | Valid type | One of: Standard, Solo, Leader, Bruiser, Horde (N/HP), Minion, Skulk, Social, Support, Ranged |
| 3 | Difficulty range | Within tier Improvised Statistics range, plus or minus 3 |
| 4 | HP appropriate | Matches type/tier guidelines (Minion=1, Standard=4-6, Solo=7+, etc.) |
| 5 | Stress range | Between 2 and 6 |
| 6 | Threshold format | `"Minor N / Major N / Severe N"` with tier-appropriate values |
| 7 | ATK within range | Modifier within tier baseline plus or minus 4 |
| 8 | Damage dice | Appropriate to type and tier (Bruisers/Solos highest, Social/Support lowest, Minions flat) |
| 9 | Motives count | 2-3 items with active verbs |
| 10 | Feature ordering | Passive before Action before Reaction; count within type range |
| 11 | PC-targeting | All features target PCs, not adversary mechanics |
| 12 | No fear loops | Fear-costing features do not generate Fear |
| 13 | Name + source_book | Name unique in DB; source_book = `'Generated'` |

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

- **description**: Make the adversary feel alive and dangerous -- sensory, cinematic, the kind of description that makes players lean forward ("The thing that drags itself from the collapsed mine shaft has too many joints in its arms, and the sound it makes is less a growl than a wet, deliberate clicking, like a lock being picked from the inside")
- **motives_tactics**: Active verbs with narrative flair -- not clinical tactical notes, but evocative combat behavior that tells the GM how this creature fights with personality ("Stalks the weakest party member with unsettling patience, waiting for the moment their allies are distracted before striking from below")

### Key Voice Principles (from Meta-Instructions)

- Start from specific, vivid examples -- build toward principles
- Use humor as a bridge to depth
- Frame storytelling as an act of service
- Never gatekeep; celebrate the questioner's instincts
- Reference broadly (improv, mythology, psychology)
- Enthusiastic and generous, never condescending

## Human Review Protocol

After generation and validation, present the adversary for human review.

### Present

1. **Stat block** as formatted display:
   - Name, tier, type, difficulty
   - HP, stress, thresholds
   - ATK, weapon, range, damage
   - Motives and tactics (bulleted list)
   - Experiences (formatted as "Skill: +N")
   - Features (ordered: Passive, Action, Reaction -- each with name, desc, type)
   - Description
2. **Validation checklist** results (all 13 items, pass/fail)

### Options

- **Approve** -- proceed to insert workflow
- **Request revision** -- specify which fields to revise; re-run validation after changes
- **Reject** -- discard and optionally restart with different parameters

## Insert Workflow

After human approval, insert the adversary into the database.

### Step 1: Compute searchable_text

Concatenate for full-text search:

```
searchable_text = name + ' ' + type + ' ' + description + ' ' + motives_tactics.join(' ') + ' ' + features.map(f => f.name + ' ' + f.desc).join(' ')
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
INSERT INTO daggerheart_adversaries (
  name, tier, type, description,
  motives_tactics, difficulty, thresholds,
  hp, stress, atk, weapon, range, dmg,
  experiences, features,
  searchable_text, embedding, source_book
) VALUES (
  'ADVERSARY NAME',
  1,                                      -- tier
  'Standard',                             -- type
  'Description text...',                  -- description
  ARRAY['Motive 1', 'Motive 2'],         -- motives_tactics
  12,                                     -- difficulty
  'Minor 3 / Major 7 / Severe 13',       -- thresholds
  5,                                      -- hp
  3,                                      -- stress
  '+4 (Melee)',                           -- atk
  'Rusted Greatsword',                    -- weapon
  'Melee',                                -- range
  '2d8+2',                                -- dmg
  '{"Intimidation": "+3", "Athletics": "+2"}'::jsonb,  -- experiences
  ARRAY['{"name":"Feature Name","desc":"Description...","type":"Passive"}'::jsonb],
  'computed searchable text...',          -- searchable_text
  '[embedding vector]'::vector,           -- embedding
  'Generated'                             -- source_book
);
```

## Name Uniqueness Check

Before finalizing, verify the name is not already in use:

```sql
SELECT COUNT(*) FROM daggerheart_adversaries WHERE LOWER(name) = LOWER('Proposed Name');
```

## Exemplar Query

Pull a real adversary as a structural reference:

```sql
SELECT name, tier, type, difficulty, thresholds, hp, stress,
       atk, weapon, range, dmg, motives_tactics,
       experiences, features, description
FROM daggerheart_adversaries
WHERE source_book = 'Daggerheart Core Rulebook'
ORDER BY tier, type
LIMIT 1;
```

## Coverage Check

Query to see current adversary distribution by tier and type:

```sql
SELECT tier, type, COUNT(*) as count
FROM daggerheart_adversaries
GROUP BY tier, type
ORDER BY tier, type;
```
