# CheckVoice

Voice and photo-enabled checklist web app. Create projects with checklists, then check off items by speaking naturally, snapping photos, or asking questions — powered by Claude AI.

## Prerequisites

- **Node.js** 22+ and npm
- **Ruby** 3.2+ with Bundler
- **PostgreSQL** (production) or SQLite (development)
- **Anthropic API key** for Claude AI features

## Quick Start

### 1. Clone and install

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../api
bundle install
```

### 2. Set up the database

```bash
cd api
bundle exec rails db:create db:migrate db:seed
```

### 3. Configure environment variables

Create `api/.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Start both servers

```bash
# Terminal 1: Rails API (port 3001)
cd api
bundle exec rails server -p 3001

# Terminal 2: Next.js frontend (port 3000)
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Create a project** — tap "New Project" on the dashboard
2. **Add checklists** — open a project and tap "Add Checklist"
3. **Add items** — open a checklist and add items to check off
4. **Voice check** — tap the mic button and say what you've done (e.g., "I just finished painting")
5. **Photo check** — tap the camera button and capture/upload a photo of completed work
6. **Ask questions** — go to the Assistant tab and ask "What's next on my list?"

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI | Yes |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) | No |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:3001) | No |
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key for observability | No |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key for observability | No |
| `LANGFUSE_HOST` | Langfuse host URL (default: https://cloud.langfuse.com) | No |
| `DATABASE_URL` | PostgreSQL connection string (production only) | Prod |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Rails 8 (API mode), PostgreSQL / SQLite |
| AI | Anthropic Claude Sonnet 4.6 (single-turn tool use) |
| Observability | Langfuse |
| State Management | TanStack Query |
| Design System | Sonic Clarity (Manrope + Inter, editorial aesthetic) |

## Project Structure

```
camChecklistWeb/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # Route pages (dashboard, projects, assistant)
│   │   ├── components/# UI components (header, nav, progress, toast)
│   │   ├── hooks/     # Custom hooks (voice recognition, camera)
│   │   └── lib/       # API client, types, TanStack Query hooks
│   └── package.json
├── api/               # Rails API
│   ├── app/
│   │   ├── controllers/api/v1/  # REST controllers + AI controller
│   │   ├── models/              # Project, Checklist, Item
│   │   └── services/            # AiService (Claude integration)
│   ├── spec/                    # RSpec tests (60 specs)
│   └── Gemfile
├── designs/           # Reference design HTML + screenshots
├── memory-bank/       # Project context documents
└── decisions/         # Architecture Decision Records
```

## Testing

```bash
# Backend (60 specs)
cd api
bundle exec rspec

# Frontend
cd frontend
npm run build  # Type-check + build verification
```

## Deployment

### Frontend (Vercel)
1. Connect the `frontend/` directory to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your Railway API URL
3. Deploy

### Backend (Railway)
1. Connect the `api/` directory to Railway
2. Add PostgreSQL plugin
3. Set environment variables: `ANTHROPIC_API_KEY`, `FRONTEND_URL`, `LANGFUSE_*`
4. Deploy

## License

MIT
