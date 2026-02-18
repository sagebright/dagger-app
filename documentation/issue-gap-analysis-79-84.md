# Gap Analysis: Plan vs GitHub Issues 79-84

**Plan File:** `/Users/jaykelly/.claude/plans/moonlit-swinging-matsumoto.md`
**Issues:** #79, #80, #81, #82, #83, #84
**Analysis Date:** 2026-01-23
**Branch:** `gh-79-84`

---

## Executive Summary

The original plan documented 5 implementation phases plus a persona update, creating 6 GitHub issues. After review, the scope expands to **12 issues** due to:
1. Splitting #82 into 4 granular issues
2. Adding snapshot test infrastructure
3. Adding animations/hover states (persona gap)
4. Adding functional AI generation follow-up

---

## Gap Analysis

### Gaps in Current Issues

| Gap | Current State | Required State |
|-----|---------------|----------------|
| Issue #82 too large | 4 distinct tasks bundled | Split into 4 separate issues |
| Missing animations issue | Plan mentions persona gap, no issue | Create new issue |
| Non-functional stub creates debt | Regenerate button stubbed | Create follow-up issue |
| No dependencies defined | Issues appear independent | Add explicit dependencies |
| No verification criteria | "Tests pass" only | Add specific verification steps |
| No code references | Generic file mentions | Add line numbers, code snippets |
| No test requirements | "Tests pass" implies existing only | Require new tests per issue |
| No milestone | None assigned | Create "Dial Tuning UI Polish" |
| Wrong dark mode behavior | May follow system preference | Always dark, ignore system |
| Persona scope unclear | Global file only mentioned | Both global AND project files |
| No snapshot infrastructure | Not configured in project | Create setup issue |

### Items Missing from Issues But in Plan

1. **Animations & hover states** - Plan identifies "expressive, atmospheric" as persona gap
2. **Long reading session optimization** - Mentioned in persona framework, not addressed
3. **Code line references** - Plan has them, issues don't

---

## Changes to Existing Issues

### Issue #79 (Accessibility & Button Consistency)

**Current title:** `[Dial Tuning UI 1/5] Fix accessibility and button consistency`
**New title:** `[Dial Tuning UI 2/12] Fix accessibility and button consistency`

**Add to body:**

```markdown
## Dependencies
- Depends on: #[snapshot-setup-issue]

## Code References
- Dark mode toggle: `apps/web/src/App.tsx` - useState initialization
- Button contrast: `apps/web/src/styles/globals.css`
- NumberStepper: `apps/web/src/components/dials/NumberStepper.tsx`
- OptionButtonGroup: `apps/web/src/components/dials/OptionButtonGroup.tsx`
- TierSelect: `apps/web/src/components/dials/TierSelect.tsx`

## Behavior Clarification
- Dark mode should ALWAYS be default (ignore `prefers-color-scheme` system preference)

## Verification
- [ ] Lighthouse accessibility score ≥90
- [ ] All buttons pass WCAG AA contrast (4.5:1) in both modes
- [ ] Visual snapshot tests added for button states
- [ ] Unit tests for dark mode toggle logic

## Testing Requirements
- Add unit tests for DarkModeToggle component
- Add snapshot tests for button components in light/dark modes
```

---

### Issue #80 (Desktop Layout Issues)

**Current title:** `[Dial Tuning UI 2/5] Fix desktop layout issues`
**New title:** `[Dial Tuning UI 3/12] Fix desktop layout issues`

**Add to body:**

```markdown
## Dependencies
- Depends on: #79 (button styling must be stable first)

## Code References
- TierSelect overflow: `apps/web/src/components/dials/TierSelect.tsx`
- DialTuningPanel layout: `apps/web/src/components/dials/DialTuningPanel.tsx`

## Verification
- [ ] Party Tier buttons wrap correctly at 1920px, 2560px, 3840px viewports
- [ ] Column layout balanced visually at all breakpoints
- [ ] Visual snapshot tests for layout at key breakpoints

## Testing Requirements
- Add snapshot tests for DialTuningPanel at multiple viewport widths
- Add unit test for TierSelect flex-wrap behavior
```

---

### Issue #81 (Progress Bar Redesign)

**Current title:** `[Dial Tuning UI 3/5] Redesign progress bar with phase labels`
**New title:** `[Dial Tuning UI 4/12] Redesign progress bar with phase labels`

**Add to body:**

```markdown
## Dependencies
- Depends on: #79 (consistent styling)

## Code References
- Truncation: `apps/web/src/components/adventure/PhaseProgressBar.tsx:53` - `truncate max-w-[200px]`
- Phase labels: Same file, `title` attribute only (hover-only visibility)

## Verification
- [ ] Adventure names up to 40 characters display without truncation
- [ ] All 10 phase labels visible without hover
- [ ] Progress bar fits viewport at 320px mobile width
- [ ] Visual snapshot tests for progress states

## Testing Requirements
- Add unit tests for phase label rendering
- Add snapshot tests for progress bar at various phases
```

---

### Issue #82 (Atmosphere Section UX) - TO BE CLOSED

**Action:** Close issue #82 and replace with 4 new issues:
- #82a: Pillar Balance drag-and-drop
- #82b: Confirm default dial selections
- #82c: ToneSelect AI example stubs
- #82d: EmotionalRegisterSelect AI example stubs

See "New Issues to Create" section below.

---

### Issue #83 (Theme Chips Styling)

**Current title:** `[Dial Tuning UI 5/5] Unify Theme chips with button styling`
**New title:** `[Dial Tuning UI 9/12] Unify Theme chips with button styling`

**Add to body:**

```markdown
## Dependencies
- Depends on: #79 (button styling must be finalized)

## Code References
- MultiSelectChips: `apps/web/src/components/dials/MultiSelectChips.tsx`
- Reference styling: `apps/web/src/components/dials/TierSelect.tsx` (button styles to match)

## Verification
- [ ] Theme chips visually indistinguishable from TierSelect buttons
- [ ] Selected/unselected states match other dial buttons
- [ ] Hover states consistent
- [ ] Visual snapshot tests for chip states

## Testing Requirements
- Add unit tests for chip selection behavior
- Add snapshot tests for selected/unselected/hover states
```

---

### Issue #84 (Persona Update)

**Current title:** `Update TTRPG design persona with new defaults`
**New title:** `[Dial Tuning UI 12/12] Update TTRPG design persona with new defaults`

**Modify body to clarify:**

```markdown
## Scope Clarification
Create BOTH:
1. Global persona: `~/.claude/design-personas/ttrpg.yaml`
2. Project override: `.claude/design-personas/ttrpg.yaml` (in dagger-app repo)

## Dependencies
- Depends on: All UI issues (#79-#83 replacements, #animations) - patterns validated through implementation

## Files Involved
| File | Action |
|------|--------|
| `~/.claude/design-personas/ttrpg.yaml` | Create (global) |
| `.claude/design-personas/ttrpg.yaml` | Create (project) |

## Acceptance Criteria
- [ ] Global ttrpg.yaml contains all 4 persona defaults
- [ ] Project ttrpg.yaml documents any project-specific overrides
- [ ] Both files include rationale for each pattern
- [ ] Documentation explains override mechanism
```

---

## New Issues to Create

### Issue: Snapshot Test Infrastructure Setup

**Title:** `[Dial Tuning UI 1/12] Configure snapshot testing infrastructure`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Configure Vitest snapshot testing for visual regression testing of UI components.

**Why:** UI changes need visual verification. Snapshots provide automated regression detection.

## Tasks

- [ ] Verify Vitest snapshot support works with current jsdom config
- [ ] Create `__snapshots__` directory structure convention
- [ ] Add example snapshot test for one dial component
- [ ] Document snapshot testing patterns in project

## Files Involved

| File | Action |
|------|--------|
| `apps/web/vitest.config.ts` | Modify (if needed) |
| `apps/web/src/test/setup.ts` | Modify (if needed) |
| `apps/web/src/components/dials/__snapshots__/` | Create |

## Acceptance Criteria

- [ ] `pnpm test` runs snapshot tests successfully
- [ ] Example snapshot test passes
- [ ] Snapshot update workflow documented (`pnpm test -- -u`)
- [ ] Build passes (`pnpm build`)

## Dependencies

None - this is the first issue in the sequence.
```

---

### Issue: Pillar Balance Drag-and-Drop

**Title:** `[Dial Tuning UI 5/12] Add drag-and-drop reordering to Pillar Balance`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Replace click-to-promote interaction with drag-and-drop reordering for Pillar Balance dial.

**Why:** Current click-to-promote is clunky. Swapping items 1 and 3 while keeping 2 requires multiple clicks.

## Tasks

- [ ] Add @dnd-kit/core and @dnd-kit/sortable dependencies
- [ ] Replace promoteToPrimary logic with sortable list
- [ ] Ensure keyboard accessibility for drag operations
- [ ] Add visual feedback during drag (ghost element, drop indicators)

## Files Involved

| File | Action |
|------|--------|
| `apps/web/package.json` | Modify (add @dnd-kit) |
| `apps/web/src/components/dials/PillarBalanceSelect.tsx` | Modify |

## Code References

- Current promotion logic: `PillarBalanceSelect.tsx:42-66` (promoteToPrimary function)

## Acceptance Criteria

- [ ] Items can be dragged to any position
- [ ] Keyboard users can reorder with arrow keys
- [ ] Visual feedback shows drag source and drop target
- [ ] Order persists in dial state
- [ ] Unit tests for reorder logic
- [ ] Snapshot tests for drag states
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #79 (button styling)

## Notes

Use @dnd-kit (latest stable) - provides accessibility and smooth animations.
```

---

### Issue: Confirm Default Dial Selections

**Title:** `[Dial Tuning UI 6/12] Allow confirming default dial selections`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Allow users to click an already-selected default value to mark it as "confirmed."

**Why:** Default selections appear grayed/incomplete. Users can't indicate they've reviewed and accepted defaults.

## Tasks

- [ ] Add "confirmed" state to dial value tracking
- [ ] Clicking selected default marks as confirmed (does NOT toggle off)
- [ ] Visual change from "grayed default" to "confirmed selection"
- [ ] Apply to all dial components with default values

## Files Involved

| File | Action |
|------|--------|
| `apps/web/src/components/dials/DialWrapper.tsx` | Modify |
| `apps/web/src/stores/dialStore.ts` (or equivalent) | Modify |

## Behavior Clarification

- Click on unselected option: Select it (existing behavior)
- Click on selected non-default: No change (already selected)
- Click on selected default: Mark as "confirmed" (NEW - no deselect)

## Acceptance Criteria

- [ ] Clicking default-selected dial confirms it
- [ ] Visual distinction between "default" and "confirmed" states
- [ ] Confirmed state persists through session
- [ ] Unit tests for confirmation logic
- [ ] Snapshot tests for default vs confirmed visual states
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #79 (button styling)
```

---

### Issue: ToneSelect AI Example Stubs

**Title:** `[Dial Tuning UI 7/12] Add AI example stubs to ToneSelect`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Add placeholder pop culture example text to Tone options with a non-functional regenerate button.

**Why:** Abstract tone choices (Grim, Whimsical, Epic) benefit from concrete references. This is a TTRPG persona pattern.

## Tasks

- [ ] Add example text below each tone option (e.g., "Grim like 'Game of Thrones'")
- [ ] Add refresh/regenerate icon button (non-functional)
- [ ] Regenerate button logs to console or shows "Coming soon" toast
- [ ] Style examples as secondary/helper text

## Files Involved

| File | Action |
|------|--------|
| `apps/web/src/components/dials/ToneSelect.tsx` | Modify |

## Example Content (Placeholders)

| Tone | Example |
|------|---------|
| Grim | "Dark and unforgiving like 'Game of Thrones'" |
| Whimsical | "Playful and absurd like 'Monty Python and the Holy Grail'" |
| Epic | "Grand and sweeping like 'Lord of the Rings'" |
| Lighthearted | "Fun and adventurous like 'The Princess Bride'" |

## Acceptance Criteria

- [ ] Each tone option displays a pop culture example
- [ ] Regenerate button is visible and clickable
- [ ] Clicking regenerate shows feedback (console log or toast)
- [ ] Examples styled appropriately (smaller, muted text)
- [ ] Unit tests for example rendering
- [ ] Snapshot tests for ToneSelect with examples
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #79 (button styling)

## Notes

This creates a non-functional stub. Issue #[functional-ai] will wire up actual AI generation.
```

---

### Issue: EmotionalRegisterSelect AI Example Stubs

**Title:** `[Dial Tuning UI 8/12] Add AI example stubs to EmotionalRegisterSelect`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Add placeholder pop culture example text to Emotional Register options with a non-functional regenerate button.

**Why:** Abstract emotional register choices benefit from concrete references. This is a TTRPG persona pattern.

## Tasks

- [ ] Add example text below each emotional register option
- [ ] Add refresh/regenerate icon button (non-functional)
- [ ] Regenerate button logs to console or shows "Coming soon" toast
- [ ] Style examples as secondary/helper text

## Files Involved

| File | Action |
|------|--------|
| `apps/web/src/components/dials/EmotionalRegisterSelect.tsx` | Modify |

## Example Content (Placeholders)

| Register | Example |
|----------|---------|
| Epic | "Sweeping emotions like 'Braveheart'" |
| Intimate | "Personal stakes like 'Manchester by the Sea'" |
| Heartfelt | "Emotional depth like 'Up'" |
| Detached | "Cool observation like 'No Country for Old Men'" |

## Acceptance Criteria

- [ ] Each emotional register option displays a pop culture example
- [ ] Regenerate button is visible and clickable
- [ ] Clicking regenerate shows feedback (console log or toast)
- [ ] Examples styled appropriately (smaller, muted text)
- [ ] Unit tests for example rendering
- [ ] Snapshot tests for EmotionalRegisterSelect with examples
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #79 (button styling)

## Notes

This creates a non-functional stub. Issue #[functional-ai] will wire up actual AI generation.
```

---

### Issue: Animations and Hover States

**Title:** `[Dial Tuning UI 10/12] Add expressive animations and hover states`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Add atmospheric animations and hover states across the Dial Tuning UI to align with TTRPG persona requirement for "expressive, atmospheric" interactions.

**Why:** Current UI has minimal animation (only typing indicator). Persona framework calls for atmospheric feedback that evokes wonder and immersion.

## Tasks

### Phase 1: Exploration
- [ ] Audit all interactive elements for animation opportunities
- [ ] Identify high-impact animation targets (buttons, cards, transitions)
- [ ] Document recommended animations with rationale

### Phase 2: Implementation
- [ ] Add hover glow effects to dial buttons (extend existing gold-glow)
- [ ] Add subtle hover lift/scale to cards
- [ ] Add phase transition animations in progress bar
- [ ] Add selection feedback animations (pulse, glow)
- [ ] Ensure animations respect `prefers-reduced-motion`

## Files Involved

| File | Action |
|------|--------|
| `apps/web/src/styles/globals.css` | Modify (animation definitions) |
| `apps/web/src/components/dials/*.tsx` | Modify (apply animations) |
| `apps/web/src/components/adventure/PhaseProgressBar.tsx` | Modify |

## Acceptance Criteria

- [ ] Hover states provide clear visual feedback
- [ ] Animations feel "fantasy/atmospheric" not "corporate"
- [ ] `prefers-reduced-motion: reduce` disables non-essential animations
- [ ] No performance degradation (maintain 60fps)
- [ ] Unit tests for reduced motion behavior
- [ ] Visual review confirms atmospheric feel
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #79-#83 replacements (core UI must be stable first)
```

---

### Issue: Functional AI Generation

**Title:** `[Dial Tuning UI 11/12] Wire up AI-generated pop culture examples`
**Labels:** `enhancement`

```markdown
## Overview

**What:** Make the regenerate buttons functional, generating actual AI-powered pop culture examples for Tone and Emotional Register dials.

**Why:** Issues #[tone-stubs] and #[emotional-stubs] create non-functional stubs. This completes the feature.

## Tasks

- [ ] Define API endpoint for example generation (or use existing MCP tool)
- [ ] Wire regenerate button to fetch new example
- [ ] Add loading state during generation
- [ ] Add error handling for generation failures
- [ ] Cache generated examples to avoid redundant calls

## Files Involved

| File | Action |
|------|--------|
| `apps/web/src/components/dials/ToneSelect.tsx` | Modify |
| `apps/web/src/components/dials/EmotionalRegisterSelect.tsx` | Modify |
| `apps/api/src/routes/` | Modify or Create (if new endpoint needed) |

## Acceptance Criteria

- [ ] Regenerate button fetches new AI-generated example
- [ ] Loading spinner shown during generation
- [ ] Error message shown on failure
- [ ] Examples are contextually appropriate
- [ ] Unit tests for generation flow
- [ ] Integration test for API endpoint
- [ ] Build passes (`pnpm build`)

## Dependencies

- Depends on: #[tone-stubs], #[emotional-stubs] (stubs must exist first)

## Notes

May require API server changes to expose generation capability. Coordinate with backend work.
```

---

## Milestone

**Create milestone:** "Dial Tuning UI Polish"

**Description:**
> Comprehensive UI improvements to the Dial Tuning phase, including accessibility fixes, layout corrections, enhanced interactions (drag-and-drop, animations), and AI-powered examples. Implements TTRPG persona patterns identified during design review.

**Issues to assign:**
- All 12 issues listed above

---

## Execution Order

Based on dependencies, recommended implementation order:

```
1. Snapshot infrastructure (#1) - no deps, enables testing
   ↓
2. Accessibility & button consistency (#79/2) - foundation for all styling
   ↓
   ├─→ 3. Desktop layout (#80/3)
   ├─→ 4. Progress bar (#81/4)
   ├─→ 5. Pillar Balance drag-and-drop (#5)
   ├─→ 6. Confirm defaults (#6)
   ├─→ 7. ToneSelect stubs (#7)
   ├─→ 8. EmotionalRegisterSelect stubs (#8)
   └─→ 9. Theme chips (#83/9)
        ↓
       10. Animations (#10) - after core UI stable
        ↓
       11. Functional AI (#11) - after stubs exist
        ↓
       12. Persona update (#84/12) - after patterns validated
```

**Parallelization opportunities:**
- Issues 3-9 can be worked in parallel after #2 completes
- Issue 11 can start after 7+8 complete

---

## Summary of Actions

### GitHub Issues to Update
- [ ] #79: Renumber, add dependencies, verification, code refs, dark mode clarification
- [ ] #80: Renumber, add dependencies, verification, code refs
- [ ] #81: Renumber, add dependencies, verification, code refs
- [ ] #82: Close (replaced by 4 new issues)
- [ ] #83: Renumber, add dependencies, verification, code refs
- [ ] #84: Renumber, add dependencies, clarify both file locations

### GitHub Issues to Create
- [ ] Snapshot test infrastructure (Issue 1/12)
- [ ] Pillar Balance drag-and-drop (Issue 5/12)
- [ ] Confirm default dial selections (Issue 6/12)
- [ ] ToneSelect AI example stubs (Issue 7/12)
- [ ] EmotionalRegisterSelect AI example stubs (Issue 8/12)
- [ ] Animations and hover states (Issue 10/12)
- [ ] Functional AI generation (Issue 11/12)

### Milestone to Create
- [ ] "Dial Tuning UI Polish" milestone
