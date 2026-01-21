# Orchestrate Issues

**Argument:** `$ARGUMENTS` = space-separated issue numbers or "branch" keyword

Execute multiple GitHub issues sequentially using fresh-context subagents. Each issue is handled by an independent agent that follows the full `/execute-issue` workflow.

---

## 1. Parse Arguments & Setup

### 1.1 Parse Issue Numbers
- If `$ARGUMENTS` contains numbers: parse as space-separated issue numbers
- If `$ARGUMENTS` is "branch": fetch all open issues for current branch
- If empty: show usage and exit

```bash
# Get current branch name
git branch --show-current

# If "branch" mode, fetch open issues
gh issue list --state open --json number,title,labels
```

### 1.2 Validate Environment
- [ ] Verify current branch exists and is checked out
- [ ] Verify git status is clean (no uncommitted changes)
- [ ] Run `pnpm build` to ensure baseline is passing

```bash
git status --porcelain
```

**If uncommitted changes exist:**
```
Cannot start orchestration with uncommitted changes.
Please commit or stash your changes first.
```
**STOP** - return control to user.

### 1.3 Create Orchestration Directory
```bash
mkdir -p .claude/orchestration
```

---

## 2. Pre-Orchestration Validation

### 2.1 Fetch All Issue Details

For each issue number, fetch full details:
```bash
gh issue view {N} --json number,title,body,labels
```

### 2.2 Check for Refinement Labels

For each issue, check if it has the `refine` label.

**If any issue has `refine` label:**
```
Issue #{N} has the `refine` label and requires interactive refinement.

Cannot orchestrate issues with `refine` labels automatically.
Please run `/execute-issue {N}` manually first to complete refinement,
then re-run orchestration.

Issues needing refinement: #{N}, #{M}...
```
**STOP orchestration** - return control to user.

### 2.3 Verify All Issues Have Routing Labels

Each issue must have one of: `bug`, `enhancement`, `refactor`, `test`, `documentation`

**If missing routing label:**
```
Issue #{N} is missing a routing label.

Please add one of: bug, enhancement, refactor, test, documentation
Then re-run orchestration.
```
**STOP orchestration** - return control to user.

---

## 3. Analyze Dependencies

### 3.1 Build Dependency Graph

For each issue:
1. Parse issue body for "Depends on #X" or "Blocked by #X" references
2. Extract "Files Involved" section to detect file paths
3. Compare file lists between issues to detect overlaps

### 3.2 Detect File Overlaps

If two issues share files in their "Files Involved" sections:
- The issue with the lower number executes first (implicit dependency)
- Log the detected overlap

### 3.3 Topological Sort

Sort issues to respect dependencies:
1. Issues with no dependencies first
2. Issues depending on others after their dependencies
3. Circular dependencies → report error, skip affected issues

### 3.4 Present Execution Plan

```
## Orchestration Plan

Branch: {branch}
Issues to execute: {count}

### Execution Order

| Order | Issue | Title | Dependencies |
|-------|-------|-------|--------------|
| 1 | #38 | [title] | None |
| 2 | #39 | [title] | Depends on #38 |
| 3 | #40 | [title] | Shares files with #39 |
| 4 | #41 | [title] | Independent |

### Detected Dependencies
- #39 depends on #38 (explicit: "Depends on #38")
- #40 depends on #39 (file overlap: content-validation.ts)

Proceed with orchestration?
```

Use AskUserQuestion to confirm before proceeding.

---

## 4. Execute Issues Sequentially

For each issue in execution order:

### 4.1 Check Dependency Status

Before executing issue #{N}:
- If it depends on a **failed** issue → mark as `skipped`, log reason, continue to next
- If it depends on a **completed** issue → proceed
- If it has no dependencies → proceed

### 4.2 Spawn Subagent

Use the Task tool to spawn a fresh-context subagent:

```
Task tool parameters:
  description: "Execute issue #{N}"
  subagent_type: "general-purpose"
  run_in_background: false
  prompt: [SUBAGENT_PROMPT - see Section 6]
```

### 4.3 Parse Subagent Result

When the subagent completes, look for the ORCHESTRATION_RESULT block:

```
---
ORCHESTRATION_RESULT:
status: completed|failed|blocked|needs_refinement
issue: {N}
commit_hash: <sha or "none">
files_changed:
  - <file1>
  - <file2>
tests_passed: true|false
blockers: <description or "none">
summary: <1-2 sentences>
---
```

**Handle based on status:**
- `completed` → Record success, proceed to next issue
- `failed` → Log failure, mark dependent issues as skipped, continue with independent issues
- `blocked` → Log blocker, mark dependent issues as skipped, continue with independent issues
- `needs_refinement` → Log that manual `/execute-issue` is required

### 4.4 Update Progress

After each issue completes (success or failure):
- Log the result
- Update the orchestration state tracking (mental model, no file write needed)
- Report progress to user

---

## 5. Final Validation & Summary

### 5.1 Run Full Validation

After all issues have been processed:
```bash
pnpm build && pnpm lint && pnpm test
```

### 5.2 Generate Summary Report

```
## Orchestration Complete

Branch: {branch}
Total issues: {total}
Completed: {completed_count}
Failed: {failed_count}
Skipped: {skipped_count}

### Results

| Issue | Title | Status | Commit |
|-------|-------|--------|--------|
| #38 | [title] | Completed | abc1234 |
| #39 | [title] | Failed | - |
| #40 | [title] | Skipped (depends on #39) | - |
| #41 | [title] | Completed | def5678 |

### Final Validation
- Build: [Pass/Fail]
- Lint: [Pass/Fail]
- Tests: [Pass/Fail]

### Commits Made
```
git log --oneline -{completed_count}
```

### Next Steps
1. Review commits: `git log --oneline -5`
2. Push branch: `git push origin {branch}`
3. Create PR: `gh pr create`

### Issues Requiring Manual Attention
[List any failed or blocked issues with reasons]
```

---

## 6. Subagent Prompt Template

This is the full prompt passed to each subagent via the Task tool:

```markdown
# Issue Execution Task for #{N}

**Branch:** {branch}
**Issue:** #{N}

## STEP 1: Load Required Guidance (MANDATORY FIRST STEP)

Before doing ANYTHING else, read these files to load your execution context:

1. Read `.claude/commands/execute-issue.md` - This is your PRIMARY workflow document
2. Read `CLAUDE.md` - Project context and patterns
3. Read `documentation/PLAN.md` - Architecture reference

DO NOT proceed until you have read execute-issue.md. This file contains:
- Label-based approach routing (TDD vs Coverage Guard)
- Pre-flight checklist requirements
- Clean Code standards (Section 5.1)
- Safe refactoring patterns (Section 5.2)
- Test-fix-commit workflow (Section 7)
- Compliance checks (Section 8)
- Issue commenting and closing procedures (Sections 10-11)

## STEP 2: Execute the Workflow

Now execute issue #{N} following the execute-issue.md workflow EXACTLY:

1. **Section 1:** Fetch & analyze issue via `gh issue view {N}`
2. **Section 2:** Validate labels & load context (you already loaded context in Step 1)
3. **Section 3:** Pre-flight checklist (git clean, build passes)
4. **Section 4:** Setup TodoWrite with issue tasks
5. **Section 5:** Execute implementation (with Clean Code standards from 5.1)
6. **Section 6:** Validation sequence (build, lint, targeted tests)
7. **Section 7:** Test, fix, commit workflow (LOCAL ONLY - NO PUSH)
8. **Section 8:** Compliance check
9. **Section 9:** Test coverage validation
10. **Section 10:** Comment results on issue
11. **Section 11:** Close issue if all acceptance criteria pass

## CRITICAL RULES

- **NO PUSH** - Commit locally only. The orchestrator handles coordination.
- **NO SKIPPING SECTIONS** - Follow execute-issue.md sequentially
- **IF BLOCKED** - Stop immediately and report the blocker clearly
- **IF TESTS FAIL** - Follow Section 7.2 (max 5 fix attempts), then report failure
- **REFINE LABEL** - If issue unexpectedly has `refine` label, report back immediately

## OUTPUT FORMAT

You MUST end your response with this exact structure for the orchestrator to parse:

---
ORCHESTRATION_RESULT:
status: completed|failed|blocked|needs_refinement
issue: {N}
commit_hash: <sha from `git log -1 --format=%H`, or "none" if no commit>
files_changed:
  - <relative path to file 1>
  - <relative path to file 2>
tests_passed: true|false
blockers: <describe any blockers, or "none">
summary: <1-2 sentence summary of what was implemented>
---

This structured output is REQUIRED - the orchestrator depends on it.
```

---

## 7. Error Handling

### 7.1 Circular Dependencies

If topological sort detects a cycle:
```
Circular dependency detected:
  #38 depends on #40
  #40 depends on #39
  #39 depends on #38

These issues cannot be orchestrated automatically.
Please resolve the circular dependency and try again.
```
**Skip** all issues in the cycle, continue with others.

### 7.2 Git Conflicts

If `git status` shows conflicts after a subagent commit:
```
Git conflict detected after issue #{N} commit.

Pausing orchestration. Please resolve conflicts manually:
1. Run `git status` to see conflicted files
2. Resolve conflicts
3. Run `git add .` and `git commit`
4. Re-run orchestration for remaining issues
```
**STOP** - return control to user.

### 7.3 Final Validation Failure

If the final `pnpm build && pnpm lint && pnpm test` fails:
```
Final validation failed after orchestration.

Failed step: [build|lint|test]
Error: [error message]

Recent commits that may have caused this:
- abc1234 - Issue #38: [title]
- def5678 - Issue #41: [title]

Options:
1. Investigate the failure manually
2. Roll back recent commits: `git reset --soft HEAD~{count}`
3. Fix the issue and commit
```

### 7.4 Subagent Timeout or Failure

If a subagent fails without producing ORCHESTRATION_RESULT:
```
Subagent for issue #{N} did not complete normally.

Last output: [truncated subagent output]

Marking issue #{N} as failed. Continuing with independent issues.
```

---

## Usage Examples

### Execute specific issues
```
/orchestrate-issues 38 39 40 41 42
```

### Execute all open issues on current branch
```
/orchestrate-issues branch
```

---

**Version:** 1.0.0
