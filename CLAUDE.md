# CLAUDE.md - Dagger-App

This file provides context for Claude Code when working on this project.

## Project Overview

Dagger-App is a local web application for generating Daggerheart TTRPG adventures. It converts a CLI-based adventure generator into a web interface, using Claude Code via MCP (Model Context Protocol) for AI-powered content generation.

**Key Goal:** Conversational "component tuning" - users configure 8 adventure components through a chat interface, then generate frames, scenes, NPCs, adversaries, items, and GM tools.

**The 8 Components:** Span, Scenes, Members, Tier, Tenor, Pillars, Chorus, Threads (grouped as Session / Party / Essence).

## Architecture

```
┌─────────────────┐     HTTP/WS      ┌─────────────────┐     MCP      ┌─────────────────┐
│  React Frontend │ ◄──────────────► │  MCP Bridge     │ ◄──────────► │  Claude Code    │
│  (Vite + TS)    │                  │  Server (Node)  │              │  (Your sub)     │
└────────┬────────┘                  └────────┬────────┘              └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│  Local Browser  │                  │  Supabase JMK   │
│                 │                  │  (12 content    │
└─────────────────┘                  │  tables)        │
                                     └─────────────────┘
```

### Data Flow

1. **User → Frontend:** Chat messages, component adjustments, content requests
2. **Frontend → Bridge:** HTTP REST + WebSocket for real-time updates
3. **Bridge → Claude:** MCP tool invocations for AI generation
4. **Bridge → Supabase:** Queries for Daggerheart content (frames, adversaries, items, etc.)
5. **Bridge → Frontend:** Streaming responses, draft content, phase updates

## Project Structure

```
dagger-app/
├── apps/
│   ├── web/                    # React frontend (port 5173)
│   │   ├── src/
│   │   │   ├── components/     # UI components (future: chat/, components/, content/, ui/)
│   │   │   ├── stores/         # Zustand stores (future: adventure, chat, components)
│   │   │   ├── hooks/          # Custom hooks (future: useAdventure, useMCPConnection)
│   │   │   ├── services/       # API clients (future: mcpClient, supabaseClient)
│   │   │   └── styles/         # Global CSS with Tailwind
│   │   ├── vite.config.ts      # Vite config with proxy to bridge
│   │   └── tailwind.config.ts  # Fantasy theme colors
│   │
│   └── mcp-bridge/             # Node.js bridge server (port 3001)
│       ├── src/
│       │   ├── index.ts        # Express + WebSocket entry point
│       │   ├── config.ts       # Environment configuration
│       │   ├── routes/         # REST endpoints (health.ts)
│       │   ├── middleware/     # cors.ts, logger.ts
│       │   ├── websocket/      # WebSocket handler
│       │   └── services/       # supabase.ts, daggerheart-queries.ts
│       └── .env.example        # Environment template
│
├── packages/
│   └── shared-types/           # TypeScript types shared between apps
│       └── src/
│           ├── index.ts        # API types (HealthResponse, ApiError)
│           └── database.ts     # Supabase schema types (14 tables)
│
└── documentation/
    └── PLAN.md                 # Full project plan and phase breakdown
```

## Key Patterns

### Shared Types

Types in `packages/shared-types` are shared between frontend and backend:

```typescript
import { DaggerheartFrame, DaggerheartAdversary } from '@dagger-app/shared-types';
```

### Fantasy Theme Colors

Tailwind is configured with a fantasy palette:

```typescript
// Usage in components
className="bg-parchment text-ink border-gold"
className="bg-shadow text-parchment-100"
className="text-blood-700 shadow-gold-glow"
```

Colors: `parchment`, `ink`, `gold`, `blood`, `shadow` (each with 50-950 shades)

### Supabase Client

The bridge uses a singleton pattern for Supabase:

```typescript
import { getSupabase, checkSupabaseHealth } from './services/supabase.js';

const supabase = getSupabase();
const frames = await supabase.from('daggerheart_frames').select('*');
```

### WebSocket Events (Planned)

Real-time communication between frontend and bridge:

- `chat:assistant_message` - Streaming AI responses
- `content:draft_ready` - Generated content available
- `phase:changed` - Workflow progression

## Development Workflow

### Branch Strategy

1. Create feature branch: `git checkout -b gh-<issue-number>-<short-description>`
2. Implement changes with commits referencing issue
3. Run validations: `pnpm build && pnpm lint`
4. Push and create PR: `gh pr create`

### Issue Labels → Approach

| Label | Approach |
|-------|----------|
| `bug` | TDD - Write failing test first |
| `enhancement` | TDD - Write failing test first |
| `refactor` | Coverage Guard - Maintain baseline |
| `documentation` | No tests required |

## Common Commands

### Development

```bash
# Start both frontend and bridge in parallel
pnpm dev

# Start individual apps
pnpm --filter web dev        # Frontend on http://localhost:5173
pnpm --filter mcp-bridge dev # Bridge on http://localhost:3001

# Health check
curl http://localhost:3001/health
```

### Build & Quality

```bash
# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

### Testing (When Configured)

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web test
pnpm --filter mcp-bridge test
```

## Project Skills

Auto-activating skills provide scaffolding guidance when creating new code. See `.claude/skills.md` for detailed templates.

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `code-quality` | File edits, pre-commit | Clean Code enforcement |
| `new-mcp-tool` | Creating MCP tools | Consistent tool + test structure |
| `new-component` | Creating React components | Props, ARIA, fantasy theme, tests |
| `new-store` | Creating Zustand stores | Middleware, serialization, tests |

## Project Agents

Custom agents for complex multi-step workflows. Located in `.claude/agents/`.

| Agent | Use When | Tools |
|-------|----------|-------|
| `daggerheart-content-expert` | Generating content, querying tables, validating tier-appropriate selections | Read, Glob, Grep, Bash |
| `adventure-validator` | Validating coherence, checking alignment, reviewing before export | Read, Glob, Grep |
| `mcp-tool-developer` | Creating MCP tools, extending tool registry | Read, Glob, Grep, Write, Edit, Bash |
| `integration-test-writer` | Writing integration tests, analyzing workflows | Read, Glob, Grep, Write, Edit, Bash |

### Invoking Agents

Agents auto-activate based on task context, or invoke explicitly:

```
"Use the daggerheart-content-expert agent to recommend adversaries for tier 2"
"Use the adventure-validator to check if the outline matches the components"
"Use the mcp-tool-developer to create a new tool for echo generation"
"Use the integration-test-writer to add tests for the NPC compilation workflow"
```

## Environment Variables

Copy `.env.example` to `.env` in `apps/mcp-bridge/`:

```bash
# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Supabase (JMK project)
SUPABASE_URL=https://ogvbbfzfljglfanceest.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Daggerheart Content Tables

The Supabase database contains 14 tables for Daggerheart content:

| Table | Purpose |
|-------|---------|
| `daggerheart_frames` | Adventure frameworks/settings |
| `daggerheart_adversaries` | Enemy stat blocks |
| `daggerheart_items` | Equipment and gear |
| `daggerheart_consumables` | Single-use items |
| `daggerheart_weapons` | Weapon definitions |
| `daggerheart_armor` | Armor definitions |
| `daggerheart_environments` | Location templates |
| `daggerheart_ancestries` | Character ancestries |
| `daggerheart_classes` | Character classes |
| `daggerheart_subclasses` | Class specializations |
| `daggerheart_domains` | Magic domains |
| `daggerheart_abilities` | Class/domain abilities |
| `daggerheart_communities` | Community backgrounds |
| `daggerheart_adventures` | Saved adventure state |

## Adventure Generation Phases

**The Book of Many Paths** — the app is a magical artifact where human and AI are co-casters, weaving a grand spell (an adventure) through a 7-phase ritual:

1. **Invocation** (`invocation`) — Opening the Book, naming the spell (adventure) you intend to cast
2. **Attunement** (`attunement`) — Tuning the spell's frequencies; harmonizing the 8 components that shape the adventure (CRITICAL: conversational feel)
3. **Binding** (`binding`) — Binding the spell to a foundation; selecting the thematic framework that anchors the story
4. **Weaving** (`weaving`) — Weaving threads of story into a pattern; drafting 3-6 scene briefs with feedback loop
5. **Inscription** (`inscription`) — Inscribing each scene into the Book; draft-feedback-revise per scene with NPCs, adversaries, and items per scene (absorbs former Conjuring/Summoning/Enchanting stages)
6. **Scrying** (`scrying`) — Peering into possibilities; GM creativity tools for what could happen at the table (5 categories)
7. **Sealing** (`sealing`) — The spell is sealed; the adventure is bound into the Book, ready for export

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20+ |
| Package Manager | pnpm | 9+ |
| Frontend | React | 18.3 |
| Build Tool | Vite | 6 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 7 |
| Backend | Express | 4 |
| WebSocket | ws | 8 |
| Database | Supabase | 2.91 |
| Language | TypeScript | 5.7 |
