# Dagger-Gen Web Application Plan

Convert the CLI-based Daggerheart TTRPG adventure generator into a local web application using your Claude Code subscription.

## Overview

| Aspect | Decision |
|--------|----------|
| **Frontend** | React + Vite + TypeScript + Tailwind |
| **LLM Backend** | API Server with Anthropic SDK |
| **Data Source** | Existing Supabase JMK project (12 Daggerheart tables) |
| **Storage** | Supabase + local filesystem export |
| **UI Style** | Clean modern with fantasy accents |
| **Key UX** | Conversational dial-tuning (chat interface) |

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
│  Supabase JMK   │                  │  Local FS       │
│  (content + DB) │                  │  (export)       │
└─────────────────┘                  └─────────────────┘
```

## Project Structure

```
dagger-app/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── chat/       # ChatContainer, MessageBubble, etc.
│   │   │   │   ├── dials/      # DialTuner, ReferencePointPicker, etc.
│   │   │   │   ├── content/    # FrameEditor, SceneEditor, etc.
│   │   │   │   └── ui/         # Shared components
│   │   │   ├── stores/         # Zustand stores (adventure, chat, ui)
│   │   │   ├── hooks/          # useAdventure, useMCPConnection
│   │   │   └── services/       # mcpClient, supabaseClient
│   │   └── package.json
│   │
│   └── api/                    # Express API Server
│       ├── src/
│       │   ├── routes/         # REST endpoints
│       │   ├── services/       # supabase, stripe, credits, daggerheart-queries
│       │   ├── tools/          # Stage-specific tool handlers
│       │   └── middleware/     # cors, logger, auth, rate-limit
│       └── package.json
│
├── packages/
│   └── shared-types/           # TypeScript types
│
└── pnpm-workspace.yaml
```

## Phases (Matching CLI Workflow)

1. **Setup** - Adventure name, folder
2. **Dial Tuning** - 14 dials via chat interface (CRITICAL: conversational feel)
3. **Frame** - Use existing from DB or create custom
4. **Outline** - 3-6 scene briefs with feedback loop
5. **Scenes** - Interactive draft-feedback-revise per scene
6. **NPCs** - Compile and enrich from scenes
7. **Adversaries** - Full stat blocks from Supabase
8. **Items** - Tier-appropriate rewards
9. **Echoes** - GM creativity tools (5 categories)
10. **Complete** - Export to filesystem

## Dial Tuning UI (Critical Feature)

Chat-based interface with split panel:
- **Left (60%)**: Conversation with AI, reference point cards, inline dial widgets
- **Right (40%)**: Real-time dial summary with edit buttons

```
┌─────────────────────────────────────┬──────────────────────┐
│  CONVERSATION                       │  DIAL SUMMARY        │
│                                     │                      │
│  AI: What tone resonates?           │  CONCRETE            │
│  [Princess Bride] [Witcher]         │  • Party: 4 [Edit]   │
│  [Bloodborne] [Custom...]           │  • Tier: 2 [Edit]    │
│                                     │  • Scenes: 4         │
│  User: Like Hollow Knight -         │                      │
│        mysterious and haunting      │  CONCEPTUAL          │
│                                     │  • Tone: [pending]   │
│  [Type a message...]                │  • Balance: ...      │
└─────────────────────────────────────┴──────────────────────┘
```

## Implementation Order

### Phase 1: Foundation ✅ READY

#### 1.1 Initialize pnpm Monorepo
**Label:** `infrastructure`

**Tasks:**
- [ ] Create root `package.json` with workspace scripts (`dev`, `build`, `test`, `lint`)
- [ ] Create `pnpm-workspace.yaml` with `apps/*` and `packages/*` patterns
- [ ] Create `apps/web/package.json` with React 18, Vite 5, TypeScript 5.3+
- [ ] Create `apps/api/package.json` with Express 4, ws 8, TypeScript
- [ ] Create `packages/shared-types/package.json` for shared TypeScript types
- [ ] Configure root `tsconfig.json` with project references
- [ ] Add `.nvmrc` specifying Node 20 LTS

**Files:**
| File | Action |
|------|--------|
| `package.json` | Create |
| `pnpm-workspace.yaml` | Create |
| `tsconfig.json` | Create |
| `apps/web/package.json` | Create |
| `apps/web/tsconfig.json` | Create |
| `apps/api/package.json` | Create |
| `apps/api/tsconfig.json` | Create |
| `packages/shared-types/package.json` | Create |
| `packages/shared-types/src/index.ts` | Create |
| `.nvmrc` | Create |

**Acceptance Criteria:**
- [ ] `pnpm install` succeeds from root
- [ ] `pnpm -r build` builds all packages without errors
- [ ] TypeScript project references resolve correctly
- [ ] VS Code recognizes workspace packages for imports

---

#### 1.2 Set up Vite + React + TypeScript
**Label:** `enhancement`

**Tasks:**
- [ ] Initialize Vite with React-TS template structure in `apps/web`
- [ ] Configure `vite.config.ts` with proxy to API server (localhost:3001)
- [ ] Set up path aliases (`@/` maps to `src/`)
- [ ] Enable TypeScript strict mode
- [ ] Create basic `App.tsx` with React Router placeholder
- [ ] Add `index.html` with proper meta tags

**Files:**
| File | Action |
|------|--------|
| `apps/web/vite.config.ts` | Create |
| `apps/web/src/main.tsx` | Create |
| `apps/web/src/App.tsx` | Create |
| `apps/web/index.html` | Create |
| `apps/web/tsconfig.json` | Modify |

**Acceptance Criteria:**
- [ ] `pnpm --filter web dev` starts dev server on port 5173
- [ ] Hot module replacement works (edit App.tsx, see instant update)
- [ ] TypeScript errors appear in browser overlay
- [ ] `pnpm --filter web build` produces optimized bundle in `dist/`

**Dependencies:** 1.1

---

#### 1.3 Configure Tailwind with Fantasy Theme
**Label:** `enhancement`

**Tasks:**
- [ ] Install Tailwind CSS 3.4+, PostCSS, Autoprefixer
- [ ] Create `tailwind.config.ts` with content paths
- [ ] Define fantasy color palette (parchment, ink, gold, blood, shadow)
- [ ] Add custom fonts (serif for headers, readable sans for body)
- [ ] Create `src/styles/globals.css` with Tailwind directives
- [ ] Add dark mode support (class-based)

**Files:**
| File | Action |
|------|--------|
| `apps/web/tailwind.config.ts` | Create |
| `apps/web/postcss.config.js` | Create |
| `apps/web/src/styles/globals.css` | Create |
| `apps/web/src/main.tsx` | Modify (import styles) |

**Acceptance Criteria:**
- [ ] Tailwind classes work in components
- [ ] Fantasy color palette available (`bg-parchment`, `text-ink`, etc.)
- [ ] Dark mode toggles via class on `<html>`
- [ ] Custom fonts load correctly

**Dependencies:** 1.2

---

#### 1.4 Set up API Server Skeleton
**Label:** `enhancement`

**Tasks:**
- [ ] Create Express server entry point with graceful shutdown
- [ ] Set up WebSocket server on same port (upgrade handling)
- [ ] Create health check endpoint (`GET /health`)
- [ ] Configure environment variables via dotenv (PORT, NODE_ENV)
- [ ] Add CORS configuration for frontend origin
- [ ] Create basic request logging middleware

**Files:**
| File | Action |
|------|--------|
| `apps/api/src/index.ts` | Create |
| `apps/api/src/config.ts` | Create |
| `apps/api/src/routes/health.ts` | Create |
| `apps/api/src/middleware/cors.ts` | Create |
| `apps/api/src/middleware/logger.ts` | Create |
| `apps/api/.env.example` | Create |

**Acceptance Criteria:**
- [ ] `pnpm --filter api dev` starts server on port 3001
- [ ] `GET /health` returns `{ status: "ok" }`
- [ ] Server shuts down gracefully on SIGTERM
- [ ] CORS allows requests from localhost:5173

**Dependencies:** 1.1

---

#### 1.5 Connect to Supabase JMK
**Label:** `enhancement`

**Tasks:**
- [ ] Install `@supabase/supabase-js` in api
- [ ] Create Supabase client singleton with env vars (URL, service role key)
- [ ] Create type definitions for Daggerheart tables (from existing schema)
- [ ] Add health check that verifies Supabase connection
- [ ] Create basic query helper for table access

**Files:**
| File | Action |
|------|--------|
| `apps/api/src/services/supabase.ts` | Create |
| `packages/shared-types/src/database.ts` | Create |
| `apps/api/src/routes/health.ts` | Modify (add DB check) |
| `apps/api/.env.example` | Modify (add Supabase vars) |

**Acceptance Criteria:**
- [ ] Supabase client initializes without errors
- [ ] Health endpoint reports database connectivity
- [ ] Can query `daggerheart_frames` table successfully
- [ ] Types match existing Supabase schema

**Dependencies:** 1.4

---

### Phase 2: Core Chat + Dials [REFINE]

<!-- REFINEMENT NEEDED:
- ChatContainer props/events API
- Message bubble variants and streaming behavior
- Zustand store shapes (adventure, chat, dials)
- Dial component specifications (what props, what events)
- MCP tool request/response contracts
- Real-time update patterns (optimistic vs server-confirmed)
-->

1. ChatContainer component with streaming
2. Zustand stores (adventure, chat, dials)
3. Dial components (NumberStepper, ReferencePointPicker, MultiSelectChips)
4. MCP tool for dial processing
5. Dial summary panel

---

### Phase 3: Content Generation [REFINE]

<!-- REFINEMENT NEEDED:
- Frame data structure and selection UI patterns
- Outline generation prompt structure
- Feedback loop UX (inline editing vs separate panel)
- Scene editor draft-revise workflow
- NPC extraction and enrichment logic
-->

1. Frame selection/creation UI
2. Outline generation with feedback
3. Scene editor with draft-revise loop
4. NPC compilation view

---

### Phase 4: Game Content [REFINE]

<!-- REFINEMENT NEEDED:
- Adversary picker filtering logic and UI
- Stat block display component
- Item/reward tier mapping
- Echo generation categories and prompts
-->

1. Adversary picker (Supabase queries with tier filter)
2. Item/reward selection
3. Echo generation

---

### Phase 5: Export + Polish [REFINE]

<!-- REFINEMENT NEEDED:
- Markdown export template structure
- File download mechanism (zip vs individual)
- Session persistence strategy (localStorage vs Supabase)
- Recovery UX for interrupted sessions
- Fantasy theme specifics (colors, typography, animations)
-->

1. Markdown export matching CLI structure
2. Local filesystem download
3. Session persistence/recovery
4. Fantasy theming polish

---

### Phase 6: Documentation & Scaffolding ✅ READY

#### 6.1 Create CLAUDE.md
**Label:** `documentation`

**Tasks:**
- [ ] Write project overview section
- [ ] Document architecture (frontend ↔ bridge ↔ Claude)
- [ ] List key patterns (Zustand stores, MCP tools, component conventions)
- [ ] Document development workflow (branch → implement → test → PR)
- [ ] Add common commands section

**Files:**
| File | Action |
|------|--------|
| `CLAUDE.md` | Create |

**Acceptance Criteria:**
- [ ] New developer can understand project from CLAUDE.md alone
- [ ] All key architectural decisions documented
- [ ] Commands section matches actual scripts

**Dependencies:** 1.1-1.5 (needs working project)

---

#### 6.2 Create README.md
**Label:** `documentation`

**Tasks:**
- [ ] Write project description and purpose
- [ ] Add quick start section (prerequisites, install, run)
- [ ] Document environment variables
- [ ] Add usage examples with screenshots (placeholder)
- [ ] Include contributing guidelines

**Files:**
| File | Action |
|------|--------|
| `README.md` | Create |

**Acceptance Criteria:**
- [ ] User can go from clone to running app following README
- [ ] All prerequisites listed
- [ ] Environment setup documented

**Dependencies:** 1.1-1.5

---

#### 6.3 Create .gitignore
**Label:** `infrastructure`

**Tasks:**
- [ ] Add Node.js patterns (node_modules, .npm, .yarn)
- [ ] Add build output patterns (dist, build, .vite)
- [ ] Add environment patterns (.env, .env.local)
- [ ] Add IDE patterns (.idea, .vscode/settings.json)
- [ ] Add OS patterns (.DS_Store, Thumbs.db)

**Files:**
| File | Action |
|------|--------|
| `.gitignore` | Create |

**Acceptance Criteria:**
- [ ] `git status` doesn't show generated files
- [ ] Environment files excluded
- [ ] IDE settings excluded (except shared configs)

**Dependencies:** None

---

#### 6.4 Project-Specific Skills (Optional)
**Label:** `enhancement`, `refine`

**Tasks:**
- [ ] Evaluate need for custom skills based on workflow patterns
- [ ] If needed: create skill definitions in `.claude/skills/`

**Files:**
| File | Action |
|------|--------|
| `.claude/skills/*.md` | Create (if needed) |

**Acceptance Criteria:**
- [ ] Skills improve common workflows (if created)
- [ ] Skills documented in CLAUDE.md

**Dependencies:** Phases 2-5 (need to see patterns emerge)

---

#### 6.5 Project-Specific Agents (Optional)
**Label:** `enhancement`, `refine`

**Tasks:**
- [ ] Evaluate need for custom agents based on project complexity
- [ ] If needed: create agent configurations

**Files:**
| File | Action |
|------|--------|
| `.claude/agents/*.yaml` | Create (if needed) |

**Acceptance Criteria:**
- [ ] Agents improve complex multi-step workflows (if created)
- [ ] Agent usage documented

**Dependencies:** Phases 2-5

## Critical Files

| File | Purpose |
|------|---------|
| `~/.claude/templates/dagger-gen/DIALS.md` | 14 dial definitions, questions, reference points |
| `~/.claude/templates/dagger-gen/template.yaml` | Phase config, output structure |
| `~/.claude/templates/dagger-gen/PLANNING_SKILL.md` | AI persona, content principles |
| `~/Repos/dagger-gen/the-hollow-vigil/.claude/create-project-state.json` | Example state structure |
| Supabase JMK (`ogvbbfzfljglfanceest`) | 12 content tables + adventures table |

## API Server Design

The API server exposes tools and endpoints for adventure generation:

```typescript
// Example tools
- process_dial_response(phase, userInput, currentDials)
- generate_frame_draft(dials, userPreferences)
- generate_scene_draft(sceneIndex, outline, feedback, dials)
- query_adversaries(tier, type?, tags?)
- query_items(tier, category?)
- generate_echoes(scenes, dials)
```

WebSocket events for real-time updates:
- `chat:assistant_message` - Streaming AI responses
- `content:draft_ready` - Generated content available
- `phase:changed` - Workflow progression

## Supabase Schema Enhancement

Add columns to existing `daggerheart_adventures` table:

```sql
ALTER TABLE daggerheart_adventures ADD COLUMN IF NOT EXISTS
  web_session_id uuid,
  phase_state jsonb DEFAULT '{}',
  npcs jsonb DEFAULT '[]',
  adversaries jsonb DEFAULT '[]',
  items jsonb DEFAULT '[]',
  echoes jsonb DEFAULT '[]',
  chat_history jsonb DEFAULT '[]';
```

## Verification Plan

1. **Local dev server**: `pnpm dev` runs both web and api
2. **Dial tuning flow**: Complete all 14 dials via chat, verify state persistence
3. **Content generation**: Generate a full adventure, compare output to CLI
4. **Export**: Download markdown files, verify structure matches `~/Repos/dagger-gen/`
5. **Session recovery**: Close browser, reopen, resume from last phase

## Questions Answered

- **Users**: Broader TTRPG community (but MVP is local)
- **Success**: Full feature parity with CLI
- **LLM**: MCP Server Bridge (uses Claude Code subscription, no API costs)
- **Data**: Existing Supabase JMK project
- **Storage**: Supabase primary + local filesystem export
- **UI**: Clean modern with fantasy accents, conversational dial tuning
