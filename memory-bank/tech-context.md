# Tech Context

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript strict, Tailwind v4, shadcn/ui |
| Backend | Rails 8 API-mode, PostgreSQL |
| AI | Anthropic Claude Sonnet 4.6, single-turn tool use |
| Observability | Langfuse |
| Frontend State | TanStack Query |
| Testing FE | Vitest + React Testing Library |
| Testing BE | RSpec + FactoryBot |
| Deploy FE | Vercel |
| Deploy BE | Railway |

## Monorepo Structure
- `frontend/` — Next.js app (port 3000)
- `api/` — Rails API (port 3001)

## Environment Notes
- Windows 11, Ruby at `/c/Ruby32-x64/bin`
- MSYS2 toolchain installed for native gems
- Node 22.11.0, npm 11.5.2, Ruby 3.2.10, Rails 8.1.3

## Key Configs
- CORS: Rails rack-cors allows `FRONTEND_URL` env var (default localhost:3000)
- Design system: Sonic Clarity tokens in `frontend/src/app/globals.css`
- Fonts: Manrope (headlines), Inter (body) via next/font/google
