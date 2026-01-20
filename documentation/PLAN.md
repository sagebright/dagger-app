# Dagger-Gen Web Application Plan

Convert the CLI-based Daggerheart TTRPG adventure generator into a local web application using your Claude Code subscription.

## Overview

| Aspect | Decision |
|--------|----------|
| **Frontend** | React + Vite + TypeScript + Tailwind |
| **LLM Backend** | MCP Server Bridge (uses Claude Code subscription) |
| **Data Source** | Existing Supabase JMK project (12 Daggerheart tables) |
| **Storage** | Supabase + local filesystem export |
| **UI Style** | Clean modern with fantasy accents |
| **Key UX** | Conversational dial-tuning (chat interface) |

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
│   └── mcp-bridge/             # MCP Server Bridge
│       ├── src/
│       │   ├── mcp/
│       │   │   ├── mcpServer.ts
│       │   │   └── tools/      # dialTuning, sceneGeneration, etc.
│       │   ├── routes/         # REST endpoints
│       │   └── websocket/      # Real-time communication
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

### Phase 1: Foundation
1. Initialize pnpm monorepo
2. Set up Vite + React + TypeScript
3. Configure Tailwind with fantasy theme
4. Set up MCP Bridge Server skeleton
5. Connect to Supabase JMK

### Phase 2: Core Chat + Dials
1. ChatContainer component with streaming
2. Zustand stores (adventure, chat, dials)
3. Dial components (NumberStepper, ReferencePointPicker, MultiSelectChips)
4. MCP tool for dial processing
5. Dial summary panel

### Phase 3: Content Generation
1. Frame selection/creation UI
2. Outline generation with feedback
3. Scene editor with draft-revise loop
4. NPC compilation view

### Phase 4: Game Content
1. Adversary picker (Supabase queries with tier filter)
2. Item/reward selection
3. Echo generation

### Phase 5: Export + Polish
1. Markdown export matching CLI structure
2. Local filesystem download
3. Session persistence/recovery
4. Fantasy theming polish

### Phase 6: Documentation & Scaffolding
1. CLAUDE.md - Project overview, architecture, patterns, dev workflow
2. README.md - Setup instructions, usage, contributing
3. .gitignore - Appropriate for TypeScript/React/Node
4. Skills - Custom skills for common workflows (if needed)
5. Agents - Project-specific agent configurations (if needed)

## Critical Files

| File | Purpose |
|------|---------|
| `~/.claude/templates/dagger-gen/DIALS.md` | 14 dial definitions, questions, reference points |
| `~/.claude/templates/dagger-gen/template.yaml` | Phase config, output structure |
| `~/.claude/templates/dagger-gen/PLANNING_SKILL.md` | AI persona, content principles |
| `~/Repos/dagger-gen/the-hollow-vigil/.claude/create-project-state.json` | Example state structure |
| Supabase JMK (`ogvbbfzfljglfanceest`) | 12 content tables + adventures table |

## MCP Bridge Design

The bridge exposes tools that Claude Code can invoke:

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

1. **Local dev server**: `pnpm dev` runs both web and mcp-bridge
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
