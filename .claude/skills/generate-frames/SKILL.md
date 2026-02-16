---
name: generate-frames
description: Generate Daggerheart campaign frames using Homebrew Kit creation order (pp 23-26) and structural validation. Auto-activates when user mentions creating, generating, or designing campaign frames.
activation:
  - user mentions creating or generating campaign frames
  - user mentions designing a campaign frame
  - user says /generate-frames
  - user asks to build a new frame for a Daggerheart campaign
---

# Generate Daggerheart Campaign Frames

Create narratively rich, structurally validated campaign frames for the `daggerheart_custom_frames` table. Follows the Daggerheart Homebrew Kit v1.0 (pp 23-26) creation order with structural validation. Inserts with `user_id = NULL` for system-generated content.

## Creation Order

Execute these 15 steps sequentially. Each step builds on the previous to create a coherent campaign frame.

### Step 1: Title

Choose a concise, evocative title that captures the campaign's identity.

**Constraints:** 1-6 words. Must be unique across existing `daggerheart_custom_frames` titles.

**Examples:** "The Hollow Vigil", "Shattered Meridian", "Roots of the Old Growth", "Tide and Bone"

### Step 2: Concept

Write a single sentence that distills the campaign's core premise. This is the elevator pitch -- if a player asks "What's this campaign about?", this is the answer.

**Constraints:** Exactly 1 sentence. No spoilers, no GM-only information.

**Examples:**
- "A holy order discovers that the god they serve has been dead for centuries, and something else has been answering their prayers."
- "Pirates navigate a sea of floating islands where gravity shifts with the tides."

### Step 3: Complexity Rating

Assign a complexity rating from 1-4 that signals how many moving parts the campaign has.

| Rating | Label | Description |
|--------|-------|-------------|
| 1 | Straightforward | Clear goals, familiar genre tropes, minimal faction politics |
| 2 | Moderate | Some moral ambiguity, 2-3 factions, layered but followable |
| 3 | Complex | Multiple competing agendas, unreliable information, shifting alliances |
| 4 | Intricate | Deep political webs, hidden truths, requires active note-taking |

### Step 4: Pitch

Write a 1-paragraph pitch that sells the campaign to players. This is the "back of the book" -- inviting, atmospheric, and free of spoilers or GM secrets.

**Constraints:** 1 paragraph (3-6 sentences). Player-facing only. Inviting, enthusiastic -- make the reader want to play.

**Example:**
"Somewhere beneath the Bleached Expanse, the old aqueducts still hum. The people of Dusthollow say it's just the wind, but you've heard the singing -- a low, resonant hymn that makes your teeth ache and your compass spin. The Cartographers' Guild is paying handsomely for anyone willing to map what's down there. They neglected to mention that the last three teams never came back."

### Step 5: Tone & Feel

Select 2-4 descriptive phrases that capture the campaign's emotional register. These guide both the GM's narration style and the players' expectations.

**Constraints:** Array of 2-4 strings.

**Examples of tone phrases:** "Grimdark with gallows humor", "Hopepunk -- light in dark places", "Mythic and reverent", "Pulpy action-adventure", "Quiet dread and creeping horror", "Swashbuckling and irreverent"

### Step 6: Themes

Identify 3-5 thematic threads that the campaign explores. Themes are the ideas the campaign asks questions about -- not the plot, but what the plot is *about*.

**Constraints:** Array of 3-5 strings.

**Examples:** "faith vs. evidence", "the cost of empire", "what we owe the dead", "borders and belonging", "memory as power"

### Step 7: Touchstones

List 2-6 cultural reference points (films, books, games, TV shows, myths) that help players calibrate expectations.

**Constraints:** Array of 2-6 strings. Mix media types when possible.

**Examples:** "Hollow Knight (atmosphere)", "Princess Mononoke (moral complexity)", "The Locked Tomb series (tone)", "Dark Souls (exploration feel)", "Over the Garden Wall (whimsy + dread)"

### Step 8: Overview

Write 1-3 paragraphs that describe the campaign setting and situation. This is the player-facing briefing -- no GM secrets, no plot twists revealed. Expansive, vivid -- make the world feel lived-in.

**Constraints:** 1-3 paragraphs. Player-facing only. Establishes the world, the current situation, and why the PCs are involved.

### Step 9: Heritage & Classes

Provide guidance on which ancestries and classes fit the campaign setting. This is not a hard restriction but a recommendation that helps players build characters who belong in the world.

**Format:** JSON object with two arrays:

```json
{
  "recommended_ancestries": ["Ancestry 1", "Ancestry 2"],
  "recommended_classes": ["Class 1", "Class 2"],
  "notes": "Optional narrative context for why these fit."
}
```

**Guidance:** Reference existing ancestries and classes from `daggerheart_ancestries` and `daggerheart_classes` tables. Include a `notes` field explaining the thematic fit.

### Step 10: Player Principles

Write 3-5 principles that guide player behavior and character choices within the campaign. These are the unspoken rules of the genre -- the things that make characters feel like they belong in this story.

**Constraints:** Array of 3-5 strings. Each principle is 1 sentence, written as an imperative.

**Examples:**
- "Trust is earned in blood and shared meals, never in words alone."
- "The wilderness is not your enemy -- it is indifferent, which is worse."
- "When in doubt, follow the music."

### Step 11: GM Principles

Write 3-5 principles that guide GM narration and world behavior. These shape how the world responds to the PCs and what kinds of consequences emerge.

**Constraints:** Array of 3-5 strings. Each principle is 1 sentence, written as an imperative.

**Examples:**
- "Let the gods be silent when it matters most."
- "Reward curiosity with danger and beauty in equal measure."
- "Every ruin was once someone's home -- narrate accordingly."

### Step 12: Distinctions

Write 3 or more distinctions -- the unique features that make this campaign setting different from generic fantasy. Distinctions answer the question: "Why should I play THIS campaign instead of any other?"

**Format:** JSON array of objects:

```json
[
  {
    "name": "Distinction Name",
    "description": "1-2 sentences explaining what makes this distinct and how it affects play."
  }
]
```

**Constraints:** Minimum 3 entries. Specific, vivid, occasionally playful. Each distinction should be mechanically or narratively actionable, not just flavor.

**Examples:**
- `{ "name": "The Tide Remembers", "description": "Every spell cast near the coast echoes back 1d4 hours later as a distorted reflection. GMs can spend a Fear to trigger an echo at a dramatically inconvenient moment." }`
- `{ "name": "No Gods, Only Echoes", "description": "Divine magic works, but nobody knows why. Clerics and paladins must reckon with the possibility that their power comes from something other than what they believe." }`

### Step 13: Inciting Incident

Write the event or situation that pulls the PCs into the campaign. This is the moment the adventure begins -- the hook, the call to action.

**Constraints:** 1-2 paragraphs. Player-facing. Should create immediate tension and a clear first question the PCs need to answer.

### Step 14: Custom Mechanics

Define 0 or more custom mechanics unique to this campaign setting. These are optional -- not every frame needs them. When present, they should reinforce the themes and distinctions.

**Format:** JSON array of objects (may be empty `[]`):

```json
[
  {
    "name": "Mechanic Name",
    "description": "How it works mechanically.",
    "trigger": "When this mechanic activates.",
    "effect": "What happens when it fires."
  }
]
```

**Guidance:** Custom mechanics should be simple (1-2 sentences each for trigger and effect), thematically resonant, and avoid adding bookkeeping. If a mechanic requires tracking more than one value, reconsider.

### Step 15: Session Zero Questions

Write 5-8 questions designed for Session Zero -- the pre-campaign conversation where players and GM align expectations and build connections.

**Constraints:** Array of 5-8 strings. Questions should be open-ended, specific to this campaign's themes, and generate character hooks.

**Examples:**
- "What does your character believe about the old gods -- and are they right?"
- "Which faction has your character already had dealings with, and did it end well?"
- "What is one thing your character refuses to do, no matter the stakes?"

## Batch Generation

Generate multiple campaign frames per invocation. Default batch size is **5**. The user may request fewer (e.g., "generate 2 frames").

### Count

Ask the user how many frames to generate during the initial conversation. If unspecified, default to 5.

### Diversity Strategy

Auto-diversify **complexity_rating** and thematic focus across the batch:

- Spread complexity ratings across the batch (e.g., one each of ratings 1-4, plus one extra)
- Vary tone_feel and themes to create distinct campaign identities -- no two frames should feel like reskins of each other
- If the user specified a complexity rating or theme, keep that constant but vary other dimensions (touchstones, distinctions, inciting incidents)
- Each frame should answer a different dramatic question

### Per-Entry Creation

Run the full 15-step creation order independently for each entry. Each frame gets its own title, concept, pitch, themes, overview, principles, distinctions, and all other fields. Ensure no duplicate titles within the batch or against existing DB entries.

## Structural Invariants

These rules must hold for every generated campaign frame:

1. **Title length:** 1-6 words, unique across `daggerheart_custom_frames`
2. **Concept format:** Exactly 1 sentence (contains exactly one terminal punctuation mark)
3. **Complexity rating:** Integer from 1 to 4 inclusive
4. **Pitch scope:** 1 paragraph (3-6 sentences), no GM secrets
5. **Tone & Feel count:** Array of 2-4 strings
6. **Themes count:** Array of 3-5 strings
7. **Touchstones count:** Array of 2-6 strings
8. **Overview scope:** 1-3 paragraphs, player-facing only
9. **Principles count:** 3-5 player principles, 3-5 GM principles
10. **Distinctions minimum:** 3 or more entries, each with name and description
11. **source_book value:** Always set to `'Generated'`

## Validation Checklist

Before presenting the frame for review, verify all 11 items:

| # | Check | Rule |
|---|-------|------|
| 1 | Title length | 1-6 words, unique across existing custom_frames |
| 2 | Concept format | Exactly 1 sentence |
| 3 | Complexity range | Integer 1-4 |
| 4 | Pitch scope | 1 paragraph (3-6 sentences), no GM secrets |
| 5 | Tone & Feel count | 2-4 items |
| 6 | Themes count | 3-5 items |
| 7 | Touchstones count | 2-6 items |
| 8 | Overview scope | 1-3 paragraphs, player-facing |
| 9 | Principles count | 3-5 player principles AND 3-5 GM principles |
| 10 | Distinctions minimum | 3+ entries with name and description |
| 11 | source_book | Set to `'Generated'` |

## Human Review Protocol

After generation and validation, present all campaign frames for batch review.

### Present

1. **Summary table** of all entries:

| # | Title | Complexity | Themes (first 2) | Validation |
|---|-------|-----------|-------------------|------------|
| 1 | ... | 2 | faith, empire | Pass/Fail |

2. **Full frame summary** for each entry as formatted JSON (title, concept, complexity_rating, pitch, tone_feel, themes, touchstones, overview, heritage_classes, player_principles, gm_principles, distinctions, inciting_incident, custom_mechanics, session_zero_questions)
3. **Validation checklist** results per entry (all 11 items, pass/fail)

### Options

- **Approve All** -- insert all entries
- **Approve Selected** -- specify entry numbers to insert (e.g., "approve 1, 3, 5")
- **Revise** -- specify entry number and which fields to change; re-validate after
- **Reject** -- specify entries to discard

## Insert Workflow

After human approval, insert each approved campaign frame into the database. Repeat steps 1-4 for each approved entry.

### Step 1: Check Name Uniqueness

```sql
SELECT title FROM daggerheart_custom_frames WHERE LOWER(title) = LOWER('FRAME TITLE');
```

If a match is found, prompt the user to choose a different title before proceeding.

### Step 2: Compute searchable_text

Concatenate for full-text search:

```
searchable_text = title + ' ' + concept + ' ' + pitch + ' ' + themes.join(' ') + ' ' + overview + ' ' + inciting_incident
```

### Step 3: Generate Embedding

Call the `embed` Edge Function to generate the embedding vector:

```sql
-- Via Supabase Edge Function (not direct SQL)
-- POST to: {SUPABASE_URL}/functions/v1/embed
-- Body: { "input": searchable_text }
-- Returns: { "embedding": [float array] }
```

### Step 4: Insert via execute_sql

Use `execute_sql` (not `apply_migration` -- this is content data, not schema):

```sql
INSERT INTO daggerheart_custom_frames (
  user_id, title, concept, pitch, tone_feel, themes,
  complexity_rating, touchstones, overview, heritage_classes,
  player_principles, gm_principles, distinctions,
  inciting_incident, custom_mechanics, session_zero_questions,
  source_book, embedding
) VALUES (
  NULL,                                 -- user_id (system-generated)
  'FRAME TITLE',                        -- title
  'One-sentence concept...',            -- concept
  'Pitch paragraph...',                 -- pitch
  ARRAY['Tone 1', 'Tone 2'],           -- tone_feel
  ARRAY['Theme 1', 'Theme 2', 'Theme 3'], -- themes
  2,                                    -- complexity_rating (1-4)
  ARRAY['Touchstone 1', 'Touchstone 2'], -- touchstones
  'Overview paragraphs...',             -- overview
  '{"recommended_ancestries": [...], "recommended_classes": [...], "notes": "..."}'::jsonb, -- heritage_classes
  ARRAY['Principle 1', 'Principle 2', 'Principle 3'], -- player_principles
  ARRAY['Principle 1', 'Principle 2', 'Principle 3'], -- gm_principles
  '[{"name": "...", "description": "..."}]'::jsonb, -- distinctions
  'Inciting incident text...',          -- inciting_incident
  '[{"name": "...", "description": "...", "trigger": "...", "effect": "..."}]'::jsonb, -- custom_mechanics
  ARRAY['Question 1?', 'Question 2?'], -- session_zero_questions
  'Generated',                          -- source_book
  '[embedding vector]'::vector          -- embedding
);
```

### Step 5: Report Results

After all approved entries are inserted, present a summary:

| # | Title | Status |
|---|-------|--------|
| 1 | ... | Inserted / Skipped / Failed |

## Exemplar Query

Pull an existing custom frame as a structural reference:

```sql
SELECT title, concept, complexity_rating, pitch, tone_feel, themes,
       touchstones, overview, heritage_classes, player_principles,
       gm_principles, distinctions, inciting_incident, custom_mechanics,
       session_zero_questions
FROM daggerheart_custom_frames
WHERE source_book IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
```
