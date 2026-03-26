# 0001: Project Bootstrap

## Date
2026-03-26

## Status
Accepted

## Context
Starting CheckVoice from scratch. PRD specifies Next.js + Rails split architecture.

## Decision
- Monorepo: `frontend/` (Next.js 15) + `api/` (Rails 8 API-mode)
- Database: PostgreSQL (Railway managed)
- Design system: Sonic Clarity tokens in Tailwind v4
- AI: Claude Sonnet 4.6 with single-turn tool use
- No auth for MVP
- TDD with Vitest (frontend) + RSpec (backend)

## Consequences
- Two build systems to manage (npm + bundler)
- CORS configuration needed between frontend/backend
- Ruby toolchain installed on Windows (Ruby 3.2 + MSYS2)
