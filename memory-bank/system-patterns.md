# System Patterns

## Architecture
Split frontend/backend. Next.js on Vercel handles SSR and client-side media APIs. Rails on Railway handles persistence, AI orchestration, and observability.

## Data Flow
```
User (mobile browser)
  ├── Voice: Web Speech API → transcript
  ├── Photo: getUserMedia / file upload → image
  └── Text: direct input
  │
  ▼
Next.js Frontend (Vercel) → REST API → Rails API (Railway)
  ├── CRUD → PostgreSQL
  └── AI → Claude API (tool use) → Langfuse traces
```

## AI Pattern
Single-turn tool use with two tools:
1. `check_items` — matches user input (text or image) to checklist items
2. `answer_question` — answers questions about checklist progress

## API Design
RESTful, nested resources:
- `/api/v1/projects` → `/checklists` → `/items`
- `/api/v1/checklists/:id/voice` — voice-to-check
- `/api/v1/checklists/:id/photo` — photo-to-check
- `/api/v1/checklists/:id/ask` — questions

## Frontend Patterns
- Server Components for data fetching
- Client Components for media APIs (voice, camera)
- TanStack Query for server state + optimistic updates
- Bottom nav with 3 tabs: Dashboard, Projects, Assistant
