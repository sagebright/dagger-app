# Review Clean Code

**Argument:** `$ARGUMENTS` = Scope (optional)

---

## 1. Parse Scope

Determine what files to review based on `$ARGUMENTS`:

| Argument | Scope | Command |
|----------|-------|---------|
| (empty) | Staged changes | `git diff --cached --name-only` |
| `staged` | Staged changes | `git diff --cached --name-only` |
| `all` | Full codebase | Glob `**/*.{ts,tsx,js,jsx}` excluding node_modules, dist |
| `path/to/file.ts` | Single file | Direct path |
| `path/to/folder` | Folder contents | Glob `path/to/folder/**/*.{ts,tsx,js,jsx}` |
| `--type=css` | Expand file types | Add `.css`, `.scss` to patterns |
| `--type=all` | All source files | Add `.json`, `.md`, `.css`, etc. |

**Default file types:** `.ts`, `.tsx`, `.js`, `.jsx`

### Scope Detection Logic

```
IF $ARGUMENTS is empty OR "staged":
  → Get staged files: git diff --cached --name-only --diff-filter=ACMR
  → Filter to supported file types
  → If no staged files: "No staged changes to review. Stage files with `git add` or specify a path."

ELSE IF $ARGUMENTS is "all":
  → Glob all source files in project
  → Exclude: node_modules, dist, build, .git, coverage, *.min.js

ELSE IF $ARGUMENTS is a file path:
  → Verify file exists
  → Add to review list

ELSE IF $ARGUMENTS is a directory:
  → Glob directory for supported file types

ELSE:
  → Error: "Invalid scope. Use: staged, all, or a file/folder path"
```

---

## 2. File Collection

For each file in scope:

```bash
# For staged changes
git diff --cached --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$'

# For full codebase
find apps packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.git/*"
```

**Output:** List of files to analyze

**If no files found:**
```
No files to review in the specified scope.

Usage:
  /review-clean-code          Review staged changes
  /review-clean-code all      Review entire codebase
  /review-clean-code src/     Review specific folder
  /review-clean-code file.ts  Review specific file
```

---

## 3. Analysis Phase

For each file, read content and check against Clean Code rules.

### 3.1 Violation Categories

#### Naming Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| N1 | Single-letter variables (except `i`, `j`, `k` in loops) | Critical | `/\b(const|let|var)\s+[a-z]\s*[=:]/` |
| N2 | Generic names (`data`, `info`, `temp`, `result`, `value`) | Warning | Variable name matches generic list |
| N3 | Boolean without prefix (`is`, `has`, `should`, `can`, `will`) | Warning | Boolean type without standard prefix |
| N4 | Inconsistent naming (mixing camelCase/snake_case) | Warning | Mixed conventions in same file |

#### Function Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| F1 | Function exceeds 30 lines | Critical | Count lines between `{` and `}` |
| F2 | More than 3 parameters | Warning | Parameter count in signature |
| F3 | Nesting depth >3 levels | Critical | Indentation analysis |
| F4 | No return type (TypeScript) | Suggestion | Missing `: ReturnType` |

#### DRY Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| D1 | Repeated code block (3+ lines, 2+ occurrences) | Warning | Similarity detection |
| D2 | Copy-pasted logic with minor variations | Warning | Near-duplicate detection |

#### Constants Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| C1 | Magic number (not 0, 1, -1, or common) | Warning | Numeric literals in logic |
| C2 | Magic string (not empty or single char) | Warning | String literals in logic |
| C3 | Repeated literal values | Warning | Same literal 3+ times |

#### Comments Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| CM1 | Commented-out code | Suggestion | `//` or `/* */` containing code patterns |
| CM2 | Obvious "what" comments | Suggestion | Comments restating the code |
| CM3 | TODO/FIXME without issue reference | Suggestion | `// TODO` without `#123` |

#### Error Handling Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| E1 | Empty catch block | Critical | `catch (e) { }` or `catch (e) { /* empty */ }` |
| E2 | Generic error message | Warning | `throw new Error('error')` or similar vague |
| E3 | Swallowed errors (catch with only console.log) | Warning | `catch (e) { console.log(e) }` |

#### Dead Code Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| DC1 | Unused variables | Suggestion | Declared but never referenced |
| DC2 | Unreachable code | Suggestion | Code after return/throw |
| DC3 | Unused imports | Suggestion | Import not referenced |

#### Complexity Violations

| ID | Check | Severity | Pattern |
|----|-------|----------|---------|
| CX1 | Long if/else chain (4+ branches) | Warning | Sequential if/else if/else |
| CX2 | Deeply nested callbacks | Critical | Callback inside callback inside callback |
| CX3 | Complex boolean expression (4+ conditions) | Warning | `&&` and `\|\|` chains |

### 3.2 Analysis Output Structure

For each violation found, capture:

```typescript
interface Violation {
  id: string;           // e.g., "F1", "N2"
  file: string;         // File path
  line: number;         // Starting line
  endLine?: number;     // Ending line (for multi-line)
  severity: 'critical' | 'warning' | 'suggestion';
  category: string;     // e.g., "Functions", "Naming"
  message: string;      // Human-readable description
  code: string;         // Code snippet
  suggestion?: string;  // Proposed fix description
  autoFixable: boolean; // Can be auto-applied
}
```

---

## 4. Report Generation

Present findings grouped by severity, then by file:

```markdown
# Clean Code Review Report

**Scope:** [staged | all | path]
**Files Analyzed:** [count]
**Violations Found:** [count] (🔴 [critical] | 🟡 [warning] | 🔵 [suggestion])

---

## 🔴 Critical ([count])

### `[file path]`

#### [ID]: [Category] - [Brief Description]
**Line [N]:**
```[language]
[code snippet]
```
**Issue:** [Detailed explanation]
**Suggestion:** [How to fix]

---

## 🟡 Warning ([count])

[Same format as Critical]

---

## 🔵 Suggestion ([count])

[Same format as Critical]

---

## Summary

| Category | Critical | Warning | Suggestion |
|----------|----------|---------|------------|
| Naming | 0 | 2 | 1 |
| Functions | 1 | 0 | 0 |
| ...      | ... | ... | ... |
| **Total** | **[N]** | **[N]** | **[N]** |
```

**If no violations found:**
```
✅ Clean Code Review Complete

No violations found in [N] files analyzed.

All code follows Clean Code principles:
- Naming conventions ✓
- Function design ✓
- DRY principles ✓
- Error handling ✓
```

---

## 5. Interactive Refactoring

After presenting the report, offer to fix violations:

```
## Ready to Refactor

Found [N] violations that can be addressed.

How would you like to proceed?
```

**Use AskUserQuestion with options:**

| Option | Behavior |
|--------|----------|
| Fix all auto-fixable | Apply all safe fixes (commented code, unused imports, magic numbers) |
| Review one by one | Present each violation, ask Apply/Skip |
| Critical only | Only address 🔴 Critical violations |
| Skip refactoring | End review, keep report only |

### 5.1 One-by-One Review Flow

For each violation (ordered by severity):

```
## Violation [current]/[total]: [ID] - [Category]

**File:** `[path]`
**Line:** [N]
**Severity:** 🔴/🟡/🔵

### Current Code
```[language]
[current code]
```

### Proposed Fix
```[language]
[fixed code]
```

### Explanation
[Why this change improves the code]
```

**Ask:** Apply this fix? [Apply | Skip | Apply All Remaining | Skip All Remaining]

### 5.2 Applying Fixes

When user approves:
1. Use Edit tool to apply the change
2. Verify syntax is valid (no introduced errors)
3. Track: `{ file, violation, status: 'applied' | 'skipped' }`

### 5.3 Fix Strategies by Violation Type

| Violation | Fix Strategy |
|-----------|--------------|
| N1 (single-letter var) | Prompt user for meaningful name |
| N2 (generic name) | Suggest contextual alternatives |
| N3 (boolean prefix) | Add `is`/`has`/`should` prefix |
| F1 (long function) | Identify extraction points, propose split |
| F2 (many params) | Propose options object pattern |
| F3 (deep nesting) | Apply early return pattern |
| C1/C2 (magic values) | Extract to named constant |
| CM1 (commented code) | Delete the lines |
| E1 (empty catch) | Add error handling template |
| DC1-3 (dead code) | Delete unused code |

---

## 6. Summary

After refactoring (or if skipped):

```
## Review Complete

### Scope
- **Target:** [staged | all | path]
- **Files Analyzed:** [N]

### Results
| Status | Count |
|--------|-------|
| Violations Found | [N] |
| Fixes Applied | [N] |
| Fixes Skipped | [N] |
| Remaining Issues | [N] |

### Applied Fixes
- `src/file.ts:23` - Extracted magic number to `TIMEOUT_MS`
- `src/file.ts:45` - Removed commented-out code
- ...

### Remaining Issues
- `src/other.ts:12` - Function `processData` still exceeds 30 lines (manual refactor needed)
- ...

### Next Steps
1. Review applied changes: `git diff`
2. Run tests: `pnpm test`
3. Address remaining issues manually
4. Stage and commit: `git add -A && git commit -m "refactor: clean code improvements"`
```

---

## Error Handling

### No files in scope
```
❌ No files to review.

Specify a scope:
- /review-clean-code staged     (staged changes)
- /review-clean-code all        (full codebase)
- /review-clean-code src/       (specific folder)
- /review-clean-code file.ts    (specific file)
```

### File not found
```
❌ File not found: [path]

Check the path and try again.
```

### Analysis error
```
⚠️ Could not analyze [file]: [error]

Skipping this file. [N] remaining files analyzed.
```

---

## Configuration Notes

### Severity Thresholds (can be customized)

| Check | Default | Configurable |
|-------|---------|--------------|
| Function max lines | 30 | `--max-lines=50` |
| Max parameters | 3 | `--max-params=4` |
| Max nesting | 3 | `--max-nesting=4` |

### File Type Extensions

| Flag | File Types |
|------|------------|
| (default) | `.ts`, `.tsx`, `.js`, `.jsx` |
| `--type=css` | + `.css`, `.scss`, `.less` |
| `--type=json` | + `.json` |
| `--type=md` | + `.md` |
| `--type=all` | All of the above |

---

**Version:** 1.0.0 (dagger-app)
