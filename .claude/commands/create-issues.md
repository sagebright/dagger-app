# Create GitHub Issues from Plan

**Argument:** `$ARGUMENTS` = Path to plan file OR empty to use current conversation context

---

## 1. Extract Plan Content

### If $ARGUMENTS contains a file path:
```bash
cat $ARGUMENTS
```

### If empty or "conversation":
Extract the most recent approved plan from the conversation context.

**Validation:**
- [ ] Plan has clear task breakdown
- [ ] Tasks are actionable (not vague)
- [ ] Dependencies between tasks are identified (if any)

---

## 2. Analyze Plan Structure

Break down the plan into discrete issues:

**Issue Sizing Guidelines:**
- Each issue should be completable in a single session
- Issues should be independently testable
- If a section has 5+ tasks, consider splitting into multiple issues
- Group related tasks that must be done together

**Identify for each issue:**
- Title (imperative verb + noun)
- Label: `bug`, `enhancement`, `refactor`, `test`, `documentation`, `refine`
- Tasks (as checkboxes)
- Files involved
- Dependencies on other issues (if any)

---

## 3. Structure Each Issue

Use this exact format for each issue (required for `/execute-issue` compatibility):

```markdown
## Overview

**What:** [Clear, concise description of what needs to be done]

**Why:** [Business or technical justification]

## Tasks

- [ ] Task 1 (specific, actionable)
- [ ] Task 2 (specific, actionable)
- [ ] Task 3 (specific, actionable)

## Files Involved

| File | Action |
|------|--------|
| `path/to/file.ts` | Create |
| `path/to/other.ts` | Modify |

## Acceptance Criteria

- [ ] Specific, testable criterion
- [ ] Another testable criterion
- [ ] Build passes (`pnpm build`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Changes committed locally (NOT pushed - user handles push)

## Notes

**References:**
- Related documentation: [links]
- Reference implementations: [file paths]

**Dependencies:**
- [Issue #X must be completed first] (if any)
```

---

## 4. Present Issues for User Review

For each proposed issue, show:

```
📋 Issue 1 of N: [Title]

Label: [label]
Tasks: [count]
Files: [count]

## Overview
[Brief summary]

## Tasks
[List of tasks]

---
Ready to create? [y/n/edit]
```

If user says "edit":
- Ask what they want to change
- Update the issue structure
- Present again

---

## 5. Create Issues via GitHub CLI

### For single issue:
```bash
gh issue create \
  --title "[Title]" \
  --label "[label]" \
  --body "$(cat <<'EOF'
## Overview

**What:** [description]

**Why:** [justification]

## Tasks

- [ ] Task 1
- [ ] Task 2

## Files Involved

| File | Action |
|------|--------|
| `path/file.ts` | Modify |

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Build and tests pass

## Notes

[Any additional context]
EOF
)"
```

### For issues needing refinement:
```bash
gh issue create \
  --title "[Title]" \
  --label "enhancement" \
  --label "refine" \
  --body "$(cat <<'EOF'
## Overview

**What:** [High-level description - details TBD]

**Why:** [Business or technical justification]

## Tasks

- [ ] [Placeholder - to be refined]

## Files Involved

| File | Action |
|------|--------|
| TBD | TBD |

## Acceptance Criteria

- [ ] [To be refined]

## Notes

**Refinement Needed:**
- [What needs clarification]
- [What decisions need to be made]
EOF
)"
```

### For grouped issues (multiple related issues):
Add prefix to title: `[Group Name 1/N]`

Example: `[API Server 1/3] Set up server skeleton`

### Branch Naming for Grouped Issues

When creating grouped issues, include branch naming guidance in the summary:

````
## Issues Created (Grouped)

Collection: gh-123-127

| # | Title | Label | Tasks |
|---|-------|-------|-------|
| 123 | [Group 1/5] [Title 1] | enhancement | 4 |
| 124 | [Group 2/5] [Title 2] | enhancement | 3 |
| 125 | [Group 3/5] [Title 3] | enhancement | 5 |
| 126 | [Group 4/5] [Title 4] | test | 2 |
| 127 | [Group 5/5] [Title 5] | refactor | 3 |

## Suggested Branch

```bash
git checkout -b gh-123-127
```

## Execution

Run `/execute-issue [number]` for each issue in a separate session.
````

---

## 6. Select Issue Label

When creating the issue, select the appropriate label:

| Condition | Label |
|-----------|-------|
| Bug fix, defect, error | `bug` |
| New feature or capability | `enhancement` |
| Code improvement without behavior change | `refactor` |
| Adding or improving tests | `test` |
| Documentation updates | `documentation` |
| Unclear scope, needs decomposition, or requires user input | `refine` |

### Using `refine` Label

Add `refine` **in combination with** a routing label when:
- Tasks are not specific/actionable yet
- Acceptance criteria are vague
- Files involved are unknown
- Implementation approach needs discussion
- Issue may need to be split into smaller issues

**Examples:**
- `refine` + `enhancement` — New feature with unclear scope
- `refine` + `bug` — Bug report needing reproduction steps
- `refine` only — Work type unclear, needs full refinement

**Note:** `/execute-issue` will pause for interactive refinement before proceeding.

---

## 7. Output Summary

After creating all issues, provide:

```
## Issues Created

| # | Title | Label | Tasks |
|---|-------|-------|-------|
| 123 | [Title 1] | enhancement | 4 |
| 124 | [Title 2] | refactor | 3 |

## Suggested Execution Order

1. #123 - [Title 1] (no dependencies)
2. #124 - [Title 2] (depends on #123)

## Run Command

To execute an issue:
```bash
/execute-issue [issue-number]
```
```

---

## Clean Code Principles (Applied to Issue Structure)

When writing issue tasks, follow Clean Code principles:

1. **Readability** - Does the task description read like clear prose?
2. **Single Responsibility** - Is each task focused on one thing?
3. **DRY** - Are duplicate tasks consolidated?
4. **Simplicity** - Are tasks broken down to minimum complexity?
5. **Maintainability** - Can someone unfamiliar execute these tasks?

### Task Naming Guidelines

Use clear, imperative language for tasks:

| Do | Don't |
|----|-------|
| "Extract validation logic to `useFormValidation` hook" | "Handle validation" |
| "Add `isLoading` state to prevent double submission" | "Improve form" |
| "Rename `data` parameter to `userProfile` for clarity" | "Update naming" |
| "Split `handleSubmit` into `validateForm` and `submitForm`" | "Refactor submit" |

**Verbs to use:** Add, Create, Extract, Fix, Implement, Refactor, Remove, Rename, Replace, Split
**Verbs to avoid:** Handle, Improve, Update, Work on, Deal with

### Include Quality Expectations in Tasks

When a task involves code changes, include specific quality targets:

```markdown
- [ ] Extract `calculateTotal` to separate utility function (max 20 lines)
- [ ] Rename `d` variable to `discountPercentage` for clarity
- [ ] Split `processOrder` into validation, calculation, and persistence functions
- [ ] Replace magic number `86400` with `SECONDS_PER_DAY` constant
```

### Anti-Pattern Detection

Before creating the issue, verify tasks will NOT introduce:

| Anti-Pattern | Check |
|--------------|-------|
| God functions | No single function >30 lines planned |
| Magic values | Numbers/strings will be named constants |
| Deep nesting | No logic >3 levels of indentation |
| Long signatures | No function with >3 parameters (use options object) |
| Copy-paste code | Similar logic extracted to shared function |
| Vague names | All new names reveal intent |

If a task might introduce these, rewrite it to explicitly address the concern:

❌ "Add discount calculation"
✅ "Add `calculateDiscount(price, percentage)` function with early return for zero percentage"

---

## Error Handling

### No plan found
```
❌ No plan content found.

Provide either:
1. A path to a plan file: /create-issues path/to/plan.md
2. Confirm using conversation context: /create-issues conversation
```

### GitHub CLI not authenticated
```
❌ GitHub CLI not authenticated.

Run: gh auth login
```

### Issue creation fails
```
❌ Failed to create issue: [error message]

Retry or check GitHub CLI configuration.
```

---

**Version**: 1.0.0 (dagger-app)
