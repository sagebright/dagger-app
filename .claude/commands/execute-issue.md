# Execute GitHub Issue

**Argument:** `$ARGUMENTS` = GitHub issue number

---

## 1. Fetch & Analyze Issue

```bash
gh issue view $ARGUMENTS
```

- [ ] Note issue **title** and **labels**
- [ ] Identify sections: Overview, Tasks, Files, Acceptance Criteria, Notes
- [ ] Check for dependencies (linked issues, prerequisites)

---

## 2. Validate Labels & Load Context

### 2.0 Baseline Documentation

**Always load:**
- [ ] `documentation/PLAN.md` — Architecture, project structure, tech stack

<!-- TODO: Add CLAUDE_*.md docs as project matures:
- CLAUDE.md — Project overview, patterns, dev workflow
- CLAUDE_coding_standards.md — Clean Code principles
- CLAUDE_testing.md — Testing standards
-->

### 2.1 Check Labels

**If issue has `refine` label** → Proceed to Section 2.3 (Refinement Workflow)

**If no routing label AND no `refine` label** → Comment and ask:
```bash
gh issue comment $ARGUMENTS --body "Issue needs a routing label: bug, enhancement, refactor, test, documentation

Or add \`refine\` label if issue needs further clarification before implementation."
```

### 2.2 Label → Approach Mapping

| Label | Approach | Test Strategy |
|-------|----------|---------------|
| `bug` | TDD | Write failing test first (RED), fix bug (GREEN) |
| `enhancement` | TDD | Write failing test first (RED), implement (GREEN) |
| `refactor` | Coverage Guard | Capture baseline, maintain/improve coverage |
| `test` | TDD | Improve coverage, verify tests fail appropriately |
| `documentation` | — | No tests required |
| `refine` | Interactive | **Pause** — refinement required (see Section 2.3) |

**Label Categories:**
- **TDD Labels** (`bug`, `enhancement`, `test`): Write failing test first, verify coverage before + after
- **Coverage-Guard Labels** (`refactor`): Capture baseline, maintain/improve coverage
- **Modifier Labels** (`refine`): Triggers pre-execution workflow, then proceeds based on routing label

### 2.3 Check for Refinement Label

If issue has `refine` label:

```
🔄 Issue #$ARGUMENTS has the `refine` label.

This issue needs refinement before implementation can begin.
Starting interactive refinement process...
```

→ Proceed to Section 2.4 (Refinement Workflow)

### 2.4 Refinement Workflow

When `refine` label is detected, execute this interactive workflow:

#### Step 1: Analyze Current Issue State

Read the issue body and identify:
- [ ] What sections are complete vs incomplete
- [ ] What routing label(s) exist (if any)
- [ ] What specific refinements are needed

Present analysis to user:
```
## Current Issue Analysis

**Title:** [title]
**Current Labels:** [labels]
**Routing Label:** [present/missing]

### Completeness Check
| Section | Status | Notes |
|---------|--------|-------|
| Overview | ✅/⚠️/❌ | [observation] |
| Tasks | ✅/⚠️/❌ | [observation] |
| Files Involved | ✅/⚠️/❌ | [observation] |
| Acceptance Criteria | ✅/⚠️/❌ | [observation] |

### Refinement Needed
1. [First refinement area]
2. [Second refinement area]
```

#### Step 2: Interactive Refinement Questions

Ask targeted questions based on what's incomplete:

**If Overview unclear:**
```
❓ Can you describe the specific problem or feature in more detail?
   - What is the current behavior (if bug)?
   - What should the new behavior be?
   - Who/what is affected?
```

**If Tasks are vague:**
```
❓ Let's break this down into specific tasks:
   - What's the first concrete step?
   - What files will need to change?
   - Are there any dependencies on other work?
```

**If Files unknown:**
```
❓ Based on the tasks, which files should be involved?
   - [Suggest files based on codebase analysis]
   - Are there other files you know need changes?
```

**If Acceptance Criteria missing:**
```
❓ How will we know this is complete?
   - What should work that doesn't work now?
   - What tests should pass?
   - What can we verify manually?
```

**If Routing Label missing:**
```
❓ What type of work is this?
   - Bug fix (something broken) → `bug`
   - New feature (new capability) → `enhancement`
   - Code cleanup (no behavior change) → `refactor`
   - Test improvements → `test`
   - Documentation → `documentation`
```

#### Step 3: Confirm Refined Issue

Present the refined issue for approval:

```
## Refined Issue Preview

**Title:** [possibly updated title]
**Labels:** [routing label] (removing `refine`)

### Overview
**What:** [refined description]
**Why:** [refined justification]

### Tasks
- [ ] [Specific task 1]
- [ ] [Specific task 2]
- [ ] [Specific task 3]

### Files Involved
| File | Action |
|------|--------|
| `path/to/file.ts` | Modify |

### Acceptance Criteria
- [ ] [Specific criterion 1]
- [ ] [Specific criterion 2]
- [ ] Build passes (`pnpm build`)
- [ ] Tests pass (`pnpm test`)

---
Ready to update issue and proceed with execution? [y/n/edit]
```

**If user says "edit":**
- Ask what they want to change
- Update and present again

**If user says "n" (abort):**
```
⏸️ Refinement paused. Issue #$ARGUMENTS remains unchanged.

Options:
1. Run `/execute-issue $ARGUMENTS` again when ready to refine
2. Manually update the issue on GitHub
3. Remove the `refine` label if issue is ready
```
Exit workflow.

**If user says "y" (approve):**
Proceed to Step 4.

#### Step 4: Update Issue on GitHub

```bash
# Update the issue body with refined content
gh issue edit $ARGUMENTS --body "$(cat <<'EOF'
[Refined issue body from Step 3]
EOF
)"

# Remove refine label
gh issue edit $ARGUMENTS --remove-label "refine"

# Add routing label if it was missing
gh issue edit $ARGUMENTS --add-label "[routing-label]"
```

Confirm update:
```
✅ Issue #$ARGUMENTS refined and updated.

Changes made:
- Updated issue body with refined details
- Removed `refine` label
- [Added/Confirmed] `[routing-label]` label

Proceeding with execution workflow...
```

#### Step 5: Continue to Normal Execution

After successful refinement, re-fetch the updated issue and continue to **Section 3: Pre-Flight Checklist**.

---

## 3. Pre-Flight Checklist (All Issues)

```
MANDATORY BEFORE IMPLEMENTATION:
□ Read all files in Files Involved section
□ Verify dependencies complete (linked issues)
□ Check git status is clean
□ Confirm on correct branch or create feature branch
□ Run: pnpm build (baseline passing)
□ Run: pnpm test (if tests configured, capture baseline)
```

**If pre-flight fails** → Comment blocker on issue, do not proceed.

---

## 4. Setup TodoWrite

- [ ] Add each task from issue's Tasks section as a todo
- [ ] Mark first task as `in_progress`

---

## 5. Execute Implementation

For each task:
1. Mark `in_progress` in TodoWrite
2. Execute the task
3. Mark `completed` in TodoWrite

**During execution, enforce:**
- 500-line file limit (split large files)
- Input validation on user inputs
- Consistent code style

---

## 6. Validation Sequence (Label-Aware)

### Quick validation (all issues):
```bash
pnpm build
pnpm lint
```

### Targeted tests (during development iteration):

#### For apps/mcp-bridge changes:
```bash
pnpm --filter mcp-bridge test "[affected-area]"
```

#### For apps/web changes:
```bash
pnpm --filter web test "[affected-component]"
```

### TDD Labels (`bug`, `enhancement`, `test`):

**Before coding**: Write failing test first
```bash
# Write test that fails
pnpm test "[new-test-file]"
# Expect: FAIL (RED)
```

**After implementation**: Verify test passes
```bash
pnpm test "[affected-area]"
# Expect: PASS (GREEN)
```

### Coverage-Guard Labels (`refactor`):

**Before coding**: Capture baseline
```bash
pnpm test --coverage "[affected-area]"
# Note coverage %
```

**After implementation**: Verify coverage maintained/improved
```bash
pnpm test --coverage "[affected-area]"
# Verify: >= baseline % (must not decrease)
```

### Pre-commit validation (REQUIRED):
```bash
pnpm build && pnpm lint && pnpm test
```

---

## 7. Test, Fix, and Commit Workflow

### 7.1 Run Tests

```bash
pnpm test
```

If tests not yet configured, fallback:
```bash
pnpm build && pnpm lint
```

**All validations must pass before committing.**

### 7.2 If Tests Fail: Automatic Resolution Loop

1. **Analyze failures** - Read test output, identify root cause
2. **Fix the issue** - Prioritize fixing flaky tests if detected
3. **Re-run tests** - `pnpm test`
4. **Iteration limit**: If after 5 fix attempts tests still fail, **STOP** and report:
   - What's failing
   - What was attempted
   - Ask user for guidance

### 7.3 When Tests Pass: Commit (LOCAL ONLY)

```bash
git add -A
git commit -m "[type]: [issue-title] (#$ARGUMENTS)"
```

Where `[type]` is: `fix` (bug), `feat` (enhancement), `refactor` (refactor), `test` (test), `docs` (documentation)

**CRITICAL - Commit Only, No Push:**
- ❌ Do NOT run `git push` - this is USER responsibility
- ✅ Commits only contain "green" code (tests passed)
- ✅ User will push when ready and monitor CI themselves

---

## 8. Compliance Check

```
□ File size: No files over 500 lines
□ Security: Input validation on user inputs
□ Tests: Coverage maintained or improved (if tests configured)
□ Build: pnpm build passes
□ Lint: pnpm lint passes
```

---

## 9. Test Coverage Validation

### Check Test Existence:

For files modified/created:
- [ ] Components >100 lines have test file
- [ ] Custom hooks >50 lines have test file
- [ ] New features have integration tests

### Run Coverage Report (when tests configured):

```bash
pnpm test --coverage "[affected-pattern]"
```

### Evaluate Coverage:

**If coverage decreases:**
- Add tests to maintain or improve coverage
- Document reason if coverage cannot be improved (e.g., external dependencies)

---

## 10. Comment Results

```bash
gh issue comment $ARGUMENTS --body "## Implementation Complete (Local Validation)

### Context
- Labels: [labels]
- Docs reviewed: documentation/PLAN.md

### Implementation
- [x] Task 1
- [x] Task 2

### Verification
- [x] Build passes (\`pnpm build\`)
- [x] Lint clean (\`pnpm lint\`)
- [x] Tests pass (\`pnpm test\`) [or N/A if not configured]

### Commit Status
- [x] Changes committed locally
- [ ] NOT pushed (user will push when ready)

### Files Changed
- \`path/file.tsx\` (modified)

---
Executed by Claude Code"
```

---

## 11. Close Issue

Only if ALL acceptance criteria pass:
```bash
gh issue close $ARGUMENTS
```

---

## 12. User Action Required

Output to user:

```
✅ Issue closed with local validation complete.

Next steps:
1. Review changes: git log -1 --stat
2. Push to branch: git push origin [branch-name]
3. Monitor CI: gh run watch

Note: If CI fails on GitHub, reopen issue #$ARGUMENTS
```

---

## Error Handling

### No Matching Label
Comment with available labels, wait for user to add one.

### Blocked
Comment blocker details, list completed vs remaining work, leave open.

### Tests Fail
Do NOT close. Comment failure details.

### Scope Expands
Stop. Comment noting scope creep. Suggest follow-up issue.

### Refinement Aborted
If user aborts refinement: Leave issue unchanged, keep `refine` label, inform user they can re-run `/execute-issue` when ready.

---

## Quick Reference Flows

### Bug Fix (`bug` label) - TDD Required
1. Write failing test that reproduces the bug (RED)
2. Run test to confirm RED
3. Implement minimal fix
4. Run test to confirm GREEN
5. Verify no regression (coverage maintained)

### Enhancement (`enhancement` label) - TDD Required
1. Write failing test for new behavior (RED)
2. Run test to confirm RED
3. Implement feature incrementally
4. Run test to confirm GREEN after each step
5. Verify coverage improved

### Refactor (`refactor` label) - Coverage Guard
1. Capture baseline coverage for affected files
2. Ensure tests exist for code being changed
3. Make incremental changes, test after each
4. Verify no behavior changes (tests still pass)
5. Verify coverage maintained or improved

### Test (`test` label) - TDD Required
1. Identify coverage gaps
2. Write tests for uncovered paths
3. Verify tests fail appropriately when code is broken
4. Run full suite to confirm no conflicts
5. Coverage must improve

### Documentation (`documentation` label)
1. Update relevant docs
2. Verify links work
3. No tests required

### Refinement (`refine` label) - Interactive Pre-Workflow
1. Analyze issue completeness (Overview, Tasks, Files, Acceptance Criteria)
2. Ask targeted refinement questions for incomplete sections
3. Present refined issue for user approval
4. Update issue on GitHub (remove `refine`, confirm routing label)
5. Proceed with routing-label workflow (TDD/Coverage-Guard/Docs)

---

**Version**: 1.0.0 (dagger-app)
