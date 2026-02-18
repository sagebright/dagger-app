# Dagger-App

A local web application for generating Daggerheart TTRPG adventures. Converts a CLI-based adventure generator into an interactive web interface with AI-powered content generation.

## Features

- **Conversational Dial Tuning** - Configure 14 adventure parameters through a chat interface
- **AI-Powered Generation** - Create frames, scenes, NPCs, adversaries, items, and GM tools
- **Daggerheart Content Library** - Access official content from Supabase database
- **Export to Markdown** - Download complete adventures for use at your table

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20.x or higher
- [pnpm](https://pnpm.io/) 9.x or higher
- Supabase account with Daggerheart content tables configured

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/dagger-app.git
   cd dagger-app
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   Edit `apps/api/.env` and add your credentials:

   ```bash
   # Server
   PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173

   # Supabase (API uses service_role key - never expose to clients)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Anthropic
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ```

4. Start the development servers:

   ```bash
   pnpm dev
   ```

5. Open your browser to [http://localhost:5173](http://localhost:5173)

### Verify Installation

Check that both servers are running:

```bash
# Frontend should respond at:
curl http://localhost:5173

# API health check:
curl http://localhost:3001/api/health
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:5173` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Required |

## Usage

<!-- Screenshots will be added as features are implemented -->

### Adventure Generation Workflow

1. **Setup** - Name your adventure
2. **Dial Tuning** - Configure tone, party size, tier, and other parameters via chat
3. **Frame** - Select or create an adventure framework
4. **Outline** - Generate 3-6 scene briefs
5. **Scenes** - Draft and refine each scene
6. **NPCs** - Compile and enrich characters
7. **Adversaries** - Add stat blocks from the content library
8. **Items** - Select tier-appropriate rewards
9. **Echoes** - Generate GM creativity tools
10. **Export** - Download as markdown files

## Project Structure

```
dagger-app/
├── apps/
│   ├── web/                    # React frontend (port 5173)
│   └── api/                    # Express API server (port 3001)
├── packages/
│   └── shared-types/           # Shared TypeScript types
└── documentation/
    └── PLAN.md                 # Detailed project plan
```

## Available Commands

```bash
# Development
pnpm dev                        # Start all apps in parallel
pnpm --filter web dev           # Start frontend only
pnpm --filter api dev           # Start API server only

# Build & Quality
pnpm build                      # Build all packages
pnpm lint                       # Run linting
pnpm typecheck                  # Type checking

# Testing
pnpm test                       # Run all tests

# Cleanup
pnpm clean                      # Remove build artifacts
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite 6, TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| Backend | Express 4, WebSocket (ws 8) |
| Database | Supabase |
| Package Manager | pnpm 9 |

## Contributing

1. Create a feature branch from `main`:

   ```bash
   git checkout -b gh-<issue-number>-<short-description>
   ```

2. Make your changes and ensure quality checks pass:

   ```bash
   pnpm build && pnpm lint
   ```

3. Commit with a descriptive message referencing the issue:

   ```bash
   git commit -m "feat: Add dial tuning component (#123)"
   ```

4. Push and create a pull request:

   ```bash
   git push origin gh-<issue-number>-<short-description>
   gh pr create
   ```

### Commit Types

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions or changes

## License

[MIT](LICENSE)
