# CLAUDE.md - Dagger-App

This file provides context for Claude Code when working on this project.

## Project Overview

Dagger-App is a local web application for generating Daggerheart TTRPG adventures. It converts a CLI-based adventure generator into a web interface, using Claude Code via MCP (Model Context Protocol) for AI-powered content generation.

**Key Goal:** Conversational "component tuning" - users configure 8 adventure components through a chat interface, then generate frames, scenes, NPCs, adversaries, items, and GM tools.

**The 8 Components:** Span, Scenes, Members, Tier, Tenor, Pillars, Chorus, Threads (grouped as Session / Party / Essence).

## Architecture

```
┌─────────────────┐     HTTP/WS      ┌─────────────────┐     Anthropic  ┌─────────────────┐
│  React Frontend │ ◄──────────────► │  API Server     │ ◄───── SDK ──► │  Claude         │
│  (Vite + TS)    │                  │  (Express/Node) │                │  (Anthropic API)│
└────────┬────────┘                  └────────┬────────┘                └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│  Local Browser  │                  │  Supabase JMK   │
│                 │                  │  (14 content    │
└─────────────────┘                  │  tables)        │
                                     └─────────────────┘
```

### Data Flow

1. **User → Frontend:** Chat messages, component adjustments, content requests
2. **Frontend → API:** HTTP REST + WebSocket for real-time updates
3. **API → Claude:** Anthropic SDK for AI generation
4. **API → Supabase:** Queries for Daggerheart content (frames, adversaries, items, etc.)
5. **API → Frontend:** Streaming responses, draft content, phase updates

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
│   │   ├── vite.config.ts      # Vite config with proxy to API server
│   │   └── tailwind.config.ts  # Fantasy theme colors
│   │
│   └── api/                    # Express API server (port 3001)
│       ├── src/
│       │   ├── index.ts        # Express entry point
│       │   ├── config.ts       # Environment configuration
│       │   ├── startup/        # Startup validation (validate-env.ts)
│       │   ├── routes/         # REST endpoints (health, auth, credits, chat, session, etc.)
│       │   ├── middleware/     # cors, logger, auth, rate-limit, error-handler
│       │   ├── tools/          # Stage-specific tool handlers (invoking, attuning, etc.)
│       │   └── services/       # supabase, stripe, credits, daggerheart-queries
│       └── .env                # Environment variables (not committed)
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

The API server uses a singleton pattern for Supabase:

```typescript
import { getSupabase, checkSupabaseHealth } from './services/supabase.js';

const supabase = getSupabase();
const frames = await supabase.from('daggerheart_frames').select('*');
```

### WebSocket Events (Planned)

Real-time communication between frontend and API server:

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
# Start both frontend and API in parallel
pnpm dev

# Start individual apps
pnpm --filter web dev   # Frontend on http://localhost:5173
pnpm --filter api dev   # API server on http://localhost:3001

# Health check
curl http://localhost:3001/api/health
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
pnpm --filter api test
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

Configure `.env` in `apps/api/`:

```bash
# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

# Supabase (JMK project)
SUPABASE_URL=https://ogvbbfzfljglfanceest.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_jwt_here  # Must be JWT (eyJ...), NOT Management API secret

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_or_sk_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_1_CREDIT=price_id_for_starter_package
STRIPE_PRICE_5_CREDITS=price_id_for_adventurer_package
STRIPE_PRICE_15_CREDITS=price_id_for_guild_package
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

**The Sage Codex** — a collection of infinite tales that unfold through collaboration between a Sage and a human storyteller. Each adventure emerges through 6 stages of the Unfolding:

1. **Invoking** (`invoking`) — Opening the Codex, sharing the initial vision for the adventure that will unfold
2. **Attuning** (`attuning`) — Sensing the tale's character; harmonizing the 8 components that shape the adventure (CRITICAL: conversational feel)
3. **Binding** (`binding`) — Anchoring the tale to its foundation; selecting the thematic framework that grounds the story
4. **Weaving** (`weaving`) — Weaving threads of story into a pattern; drafting 3-6 scene briefs with feedback loop
5. **Inscribing** (`inscribing`) — Writing each scene into the Codex; draft-feedback-revise per scene with NPCs, adversaries, items, and portents per scene (absorbs former Conjuring/Summoning/Enchanting/Scrying stages)
6. **Delivering** (`delivering`) — The Sage delivers the completed tale; the adventure is ready to bring to life at the table

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
