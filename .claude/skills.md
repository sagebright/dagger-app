# Skills

Skills auto-activate based on context to provide specialized guidance.

---

## code-quality

**Trigger:** Auto-activates when:
- Creating or modifying `.ts`, `.tsx`, `.js`, `.jsx` files
- During `/execute-issue` before committing changes
- When file size exceeds 300 lines (warning threshold)

**Purpose:** Enforce Clean Code standards during development.

### Pre-Commit Gate Check

Before any commit during `/execute-issue`, verify:

```
CLEAN CODE GATE CHECK
━━━━━━━━━━━━━━━━━━━━━

Scanning modified files...

□ Naming: Variables and functions are self-documenting
□ Functions: No function exceeds 30 lines
□ Parameters: No function has >3 parameters
□ Nesting: No code nested >3 levels deep
□ DRY: No copy-pasted code blocks
□ Constants: No magic numbers or strings
□ Errors: Error messages are specific
□ Dead code: No unused variables or imports
```

### Quick Checks

**File Size Warning:**
```
⚠️ File `[path]` is [N] lines.

Consider splitting if it exceeds 500 lines.
Files over 300 lines should be reviewed for extraction opportunities.
```

**Function Length Warning:**
```
⚠️ Function `[name]` at line [N] is [X] lines (limit: 30).

Consider extracting:
- Lines [A-B]: [suggested function name]
- Lines [C-D]: [suggested function name]
```

### Inline Suggestions

When detecting violations during editing, suggest fixes inline:

**Magic Number Detected:**
```typescript
// ⚠️ Magic number detected
if (retries > 3) { ... }

// Suggested fix:
const MAX_RETRIES = 3;
if (retries > MAX_RETRIES) { ... }
```

**Deep Nesting Detected:**
```typescript
// ⚠️ Nesting depth: 4 levels (max: 3)
// Suggested: Use early returns

// Before:
if (user) {
  if (user.isActive) {
    if (user.hasPermission) {
      if (user.notBanned) {
        // logic
      }
    }
  }
}

// After:
if (!user) return;
if (!user.isActive) return;
if (!user.hasPermission) return;
if (user.notBanned) return;
// logic
```

### Enforcement Level

| Context | Level |
|---------|-------|
| `/execute-issue` commit | **Strict** - Block commit on Critical violations |
| Regular editing | **Advisory** - Warn but don't block |
| `/review-clean-code` | **Comprehensive** - Full analysis |

### Integration with /execute-issue

Before Section 7.3 (commit), this skill triggers:

1. Scan all modified files
2. Check against Clean Code compliance list
3. If Critical violations found:
   ```
   ❌ Clean Code gate failed. Cannot commit.

   Critical violations:
   - `src/service.ts:45` - Empty catch block (E1)
   - `src/utils.ts:12` - Function exceeds 30 lines (F1)

   Fix these issues or run `/review-clean-code` for guided refactoring.
   ```
4. If only Warnings/Suggestions:
   ```
   ⚠️ Clean Code warnings detected (non-blocking):

   - `src/service.ts:23` - Magic number (C1)
   - `src/utils.ts:8` - Generic variable name (N2)

   Consider running `/review-clean-code` after commit.

   Proceeding with commit...
   ```

---

## new-mcp-tool

**Trigger:** Auto-activates when:
- Creating files in `apps/api/src/tools/`
- User mentions "tool", "create tool", or "new tool"

**Purpose:** Scaffold tools with consistent structure, schema, handler, and tests.

### File Structure

Create two files:
- `apps/api/src/tools/{toolName}.ts`
- `apps/api/src/tools/{toolName}.test.ts`

### Tool File Template

```typescript
/**
 * {tool_name} MCP Tool
 *
 * [Description of what this tool does]
 */

import type {
  {InputType},
  {OutputType},
} from '@dagger-app/shared-types';
import type { ToolSchema } from '../mcpServer.js';

// =============================================================================
// Tool Schema
// =============================================================================

export const {UPPER_SNAKE_CASE}_SCHEMA: ToolSchema = {
  description: '[User-friendly description of the tool]',
  inputSchema: {
    type: 'object',
    properties: {
      propertyName: {
        type: 'string',
        description: '[Description of this property]',
      },
    },
    required: ['propertyName'],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * [Description of helper]
 */
function helperFunction(param: Type): ReturnType {
  // Implementation
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * [Description of what the handler does]
 */
export async function {toolName}Handler(
  input: {InputType}
): Promise<{OutputType}> {
  // Implementation
}
```

### Test File Template

```typescript
/**
 * Tests for {tool_name} MCP tool
 */

import { describe, it, expect } from 'vitest';
import {
  {toolName}Handler,
  {UPPER_SNAKE_CASE}_SCHEMA,
} from './{toolName}.js';
import type { {InputType} } from '@dagger-app/shared-types';

// Test fixture factory
const createDefaultInput = (): {InputType} => ({
  // Default test values
});

describe('{toolName} Tool', () => {
  describe('{UPPER_SNAKE_CASE}_SCHEMA', () => {
    it('should have correct schema structure', () => {
      expect({UPPER_SNAKE_CASE}_SCHEMA.description).toBeTruthy();
      expect({UPPER_SNAKE_CASE}_SCHEMA.inputSchema).toBeDefined();
      expect({UPPER_SNAKE_CASE}_SCHEMA.inputSchema?.properties).toHaveProperty('propertyName');
    });
  });

  describe('{toolName}Handler', () => {
    it('should process input and return structured output', async () => {
      const input = createDefaultInput();
      const result = await {toolName}Handler(input);

      expect(result).toHaveProperty('expectedProperty');
    });
  });
});
```

### Key Patterns

| Element | Pattern |
|---------|---------|
| Schema const | `{UPPER_SNAKE_CASE}_SCHEMA: ToolSchema` |
| Handler function | `async {toolName}Handler(input): Promise<Output>` |
| Section dividers | `// ====== Section Name ======` |
| Imports | Types from `@dagger-app/shared-types`, `ToolSchema` from `../mcpServer.js` |
| Test fixtures | `createDefault{Type}()` factory functions |

---

## new-component

**Trigger:** Auto-activates when:
- Creating files in `apps/web/src/components/`
- User mentions "React component", "create component", or "new component"

**Purpose:** Scaffold React components with consistent props, accessibility, fantasy theme, and tests.

### File Structure

Create two files:
- `apps/web/src/components/{category}/{ComponentName}.tsx`
- `apps/web/src/components/{category}/{ComponentName}.test.tsx`

Categories: `chat/`, `dials/`, `content/`, `adventure/`

### Component File Template

```typescript
/**
 * {ComponentName} Component
 *
 * [Description of purpose]
 * [Where it's used]
 * Fantasy-themed with [theme notes].
 */

import { useId } from 'react';

export interface {ComponentName}Props {
  /** [Description of prop] */
  requiredProp: string;
  /** [Description of optional prop] */
  optionalProp?: string;
  /** Callback when [event] */
  onChange?: (value: string) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function {ComponentName}({
  requiredProp,
  optionalProp,
  onChange,
  disabled = false,
  className = '',
}: {ComponentName}Props) {
  const labelId = useId();

  const handleAction = () => {
    if (disabled) return;
    onChange?.(value);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Component content with fantasy theme */}
      <button
        type="button"
        onClick={handleAction}
        disabled={disabled}
        aria-label="[Accessible name]"
        className={`
          rounded-fantasy border transition-all duration-200
          ${
            disabled
              ? 'bg-ink-100 border-ink-200 text-ink-400 cursor-not-allowed dark:bg-shadow-700'
              : 'bg-parchment-50 border-ink-300 hover:bg-gold-100 hover:border-gold-400 dark:bg-shadow-800'
          }
        `}
      >
        Content
      </button>
    </div>
  );
}
```

### Test File Template

```typescript
/**
 * {ComponentName} Component Tests
 *
 * TDD tests for [brief description]
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { {ComponentName} } from './{ComponentName}';

describe('{ComponentName}', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('renders primary content', () => {
      render(<{ComponentName} requiredProp="test" />);
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <{ComponentName} requiredProp="test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('interaction', () => {
    it('calls onChange on user action', async () => {
      const user = userEvent.setup();
      render(<{ComponentName} requiredProp="test" onChange={mockOnChange} />);

      await user.click(screen.getByRole('button'));
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('disables interaction when disabled prop true', async () => {
      const user = userEvent.setup();
      render(<{ComponentName} requiredProp="test" onChange={mockOnChange} disabled />);

      await user.click(screen.getByRole('button'));
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('shows disabled styling', () => {
      render(<{ComponentName} requiredProp="test" disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<{ComponentName} requiredProp="test" />);
      expect(screen.getByRole('button')).toHaveAccessibleName();
    });
  });
});
```

### Key Patterns

| Element | Pattern |
|---------|---------|
| Standard props | `disabled?: boolean`, `className?: string` |
| ARIA | `useId()`, `aria-label`, `aria-labelledby`, proper roles |
| Theme colors | `parchment`, `ink`, `gold`, `blood`, `shadow` (50-950 shades) |
| Border radius | `rounded-fantasy` |
| Transitions | `transition-all duration-200` |
| Button type | Always `type="button"` |
| Dark mode | Include `dark:` variants for all colors |

---

## new-store

**Trigger:** Auto-activates when:
- Creating files in `apps/web/src/stores/`
- User mentions "Zustand store", "create store", or "new store"

**Purpose:** Scaffold Zustand stores with middleware, serialization, selectors, and tests.

### File Structure

Create two files:
- `apps/web/src/stores/{storeName}.ts`
- `apps/web/src/stores/{storeName}.test.ts`

### Store File Template

```typescript
/**
 * {StoreName} Store - [Brief description]
 *
 * Manages:
 * - [State item 1]
 * - [State item 2]
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

export interface {StoreName}State {
  // State properties
  property1: string;
  property2: number;

  // Actions
  setProperty1: (value: string) => void;
  setProperty2: (value: number) => void;
  reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  property1: '',
  property2: 0,
};

// =============================================================================
// Store
// =============================================================================

export const use{StoreName}Store = create<{StoreName}State>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * [Description of action]
         */
        setProperty1: (value: string) => {
          set({ property1: value }, false, 'setProperty1');
        },

        /**
         * [Description of action]
         */
        setProperty2: (value: number) => {
          set({ property2: value }, false, 'setProperty2');
        },

        /**
         * Reset store to initial values
         */
        reset: () => {
          set(initialState, false, 'reset');
        },
      }),
      {
        name: 'dagger-{name}-storage',
        // Custom serialization for Date/Set types (if needed)
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Restore Date: parsed.state.dateField = new Date(parsed.state.dateField)
            // Restore Set: parsed.state.setField = new Set(parsed.state.setField)
            return parsed;
          },
          setItem: (name, value) => {
            // Convert Set to Array: value.state.setField = Array.from(value.state.setField)
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
        // Optionally exclude ephemeral state
        // partialize: (state) => ({ property1: state.property1 }),
      }
    ),
    { name: '{StoreName}Store' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * [Description of selector]
 */
export const selectProperty1 = (state: {StoreName}State): string =>
  state.property1;

/**
 * [Description of computed selector]
 */
export const selectIsReady = (state: {StoreName}State): boolean =>
  state.property1 !== '' && state.property2 > 0;
```

### Test File Template

```typescript
/**
 * {StoreName} Store Tests
 *
 * Tests for:
 * - Initial state
 * - Actions
 * - Selectors
 * - Persistence serialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import {
  use{StoreName}Store,
  selectProperty1,
  selectIsReady,
} from './{storeName}';
import {
  clearPersistedStorage,
  storeAction,
} from '../test/store-utils';

const STORAGE_KEY = 'dagger-{name}-storage';

describe('{storeName}', () => {
  beforeEach(() => {
    clearPersistedStorage(STORAGE_KEY);
    act(() => {
      use{StoreName}Store.getState().reset();
    });
  });

  describe('initial state', () => {
    it('starts with correct defaults', () => {
      const state = use{StoreName}Store.getState();

      expect(state.property1).toBe('');
      expect(state.property2).toBe(0);
    });
  });

  describe('setProperty1', () => {
    it('updates property1', () => {
      storeAction(() => {
        use{StoreName}Store.getState().setProperty1('new value');
      });

      const state = use{StoreName}Store.getState();
      expect(state.property1).toBe('new value');
    });
  });

  describe('selectors', () => {
    it('selectProperty1 returns property1', () => {
      storeAction(() => {
        use{StoreName}Store.getState().setProperty1('test');
      });

      const state = use{StoreName}Store.getState();
      expect(selectProperty1(state)).toBe('test');
    });

    it('selectIsReady returns true when both set', () => {
      storeAction(() => {
        use{StoreName}Store.getState().setProperty1('test');
        use{StoreName}Store.getState().setProperty2(5);
      });

      const state = use{StoreName}Store.getState();
      expect(selectIsReady(state)).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      storeAction(() => {
        use{StoreName}Store.getState().setProperty1('modified');
      });

      storeAction(() => {
        use{StoreName}Store.getState().reset();
      });

      const state = use{StoreName}Store.getState();
      expect(state.property1).toBe('');
    });
  });
});
```

### Key Patterns

| Element | Pattern |
|---------|---------|
| Middleware order | `devtools(persist(...))` |
| Action signature | `set({...}, false, 'actionName')` |
| Storage key | `dagger-{name}-storage` |
| Date serialization | `new Date(parsed.state.dateField)` |
| Set serialization | `new Set(parsed.state.setField)` / `Array.from(...)` |
| Selectors | Pure functions outside store: `(state) => value` |
| Test utilities | `clearPersistedStorage`, `storeAction` from `store-utils.ts` |

---

## Skill Reference

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `code-quality` | File edits, pre-commit | Clean Code enforcement |
| `new-tool` | Creating API tools | Consistent tool + test structure |
| `new-component` | Creating React components | Props, ARIA, fantasy theme, tests |
| `new-store` | Creating Zustand stores | Middleware, serialization, tests |
