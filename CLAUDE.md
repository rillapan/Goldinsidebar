# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo at `goldmind-ai/` with three runnable services + a shared module:

- `goldmind-ai/frontend` — Next.js 14 (App Router) + Tailwind + Socket.IO client.
- `goldmind-ai/backend` — Express.js + TypeScript + Prisma (PostgreSQL) + Socket.IO server + node-cron.
- `goldmind-ai/ai-engine` — Python FastAPI service for price ingestion, indicator calculation, and Claude API calls.
- `goldmind-ai/shared` — TS constants/types imported by backend via `tsconfig` path `@shared/*` (`../shared/*`).

The top-level `intruksi.md/` directory holds the product/architecture spec (in Indonesian). It documents the canonical end-to-end flow, feature list, tech stack, and userflow — read it when intent is unclear, especially before adding cross-service features.

## Common commands

Run from `goldmind-ai/` unless noted.

Root (dispatchers):
- `npm run install:all` — install all three services (npm + pip).
- `npm run dev:backend` / `npm run dev:frontend` / `npm run dev:ai` — start each service in dev mode.

Backend (`goldmind-ai/backend`):
- `npm run dev` — `ts-node-dev` watcher on `src/server.ts`.
- `npm run build && npm run start` — production build + run from `dist/`.
- `npm run db:migrate` / `db:generate` / `db:seed` / `db:studio` — Prisma workflow.

Frontend (`goldmind-ai/frontend`):
- `npm run dev` / `npm run build` / `npm run start` / `npm run lint` (Next.js + ESLint).

AI engine (`goldmind-ai/ai-engine`):
- `python -m uvicorn main:app --reload --port 8000` — dev server (port 8000).
- `pip install -r requirements.txt` — install deps. Pinned to `pandas-ta==0.3.14b` and `anthropic==0.8.1`.

There is no test suite or formatter configured in any service.

## Architecture — how the three services talk to each other

The data path is unidirectional through Redis and HTTP:

```
Twelve Data WS ──► ai-engine (price_feed.py) ──► Redis
                                                    │
                          ai-engine (signal_engine) ◄┘ reads candles every 5min
                                  │
                                  ▼
                          Claude API (analyze)
                                  │
                                  ▼  HTTP POST /api/internal/signals
                          backend (Express) ──► PostgreSQL
                                  │
                                  ▼ Socket.IO emit('new_signal')
                          frontend (Next.js)
```

Critical cross-service contracts to preserve when editing:

1. **Backend → AI engine**: `lib/cron.ts` calls `POST ${AI_ENGINE_URL}/api/generate-bias` daily at 00:00 UTC (07:00 WIB, Mon-Fri, `timezone: 'Asia/Jakarta'`). If you add scheduled AI tasks, follow the same pattern — the Node cron is the trigger, FastAPI does the work.
2. **AI engine → Backend**: `signal_engine.py` and `bias_engine.py` push results to the backend via internal endpoints `/api/internal/signals` and `/api/internal/bias` authenticated with header `X-Internal-Key: ${INTERNAL_API_KEY}`. Those routes are referenced but **not yet implemented** in `backend/src/routes/` — adding new internal-side endpoints requires a route module that checks `X-Internal-Key` (NOT `verifyToken`).
3. **Redis is the shared substrate**, not a backend-internal cache:
   - `price:xauusd` (TTL 120s) — current XAUUSD tick, written by Python, read by backend chat route to inject live price into Claude prompts.
   - `candles:xauusd:1m` — sorted set (max 300 entries, written by Python's `_price_feed_loop`) used by `signal_engine.fetch_candles`.
   - `session:{userId}` — JWT device-id binding for single-active-device enforcement.

## Auth + membership gating (the request-protection pattern)

Almost every premium endpoint chains `verifyToken` → `checkMembership` (see `backend/src/middleware/auth.middleware.ts`). The pattern used across `signal.routes.ts`, `bias.routes.ts`, `chat.routes.ts`:

```ts
router.use(verifyToken, checkMembership);
```

- `verifyToken` validates JWT, then checks `X-Device-ID` against `getUserSession(userId)` from Redis. If a different device is bound, returns `403 MULTI_LOGIN_DETECTED` — this enforces "1 account = 1 active device" and is intentional, not a bug.
- `checkMembership` queries the user's most recent `Membership.endDate`. If expired or status ≠ ACTIVE, returns 403 with a `redirectTo` (`/checkout` for PENDING, `/renew` otherwise). `ADMIN` role bypasses entirely.
- Admin-only routes use `verifyToken` + `requireAdmin` instead.

The frontend (`frontend/src/lib/api.ts`) reads JWT from cookie `gm_token` and persists a `localStorage` `gm_device_id` (uuid), attaching both to every request. Don't change the cookie/header names without updating both sides.

## Webhook signature verification — order matters

In `backend/src/server.ts` the Xendit webhook is registered **before** the global `express.json()` middleware:

```ts
app.use('/api/webhooks', express.json(), webhookRoutes);  // local json parser
app.use(express.json());                                   // global, applied to everything else
```

This is intentional: Xendit's `X-CALLBACK-TOKEN` verification needs predictable parsing. Don't reorder these or move webhook routes under the global JSON middleware. The webhook handler also wraps the activation in a `prisma.$transaction` (transaction → membership → user.status) — keep that atomicity if extending it.

## Database schema

`backend/prisma/schema.prisma` is the source of truth. Key models: `User`, `Membership`, `Signal`, `Transaction`, `DailyBias`, `ChatSession`, `ChatMessage`. After editing, run `npm run db:migrate` then `db:generate`. Do NOT hand-write SQL migrations — use Prisma.

A single user has many `Membership` rows (one per paid 30-day period). The "is the user currently active?" question is answered by the most recent `Membership` with `endDate > now` AND `isActive = true`, NOT by `User.status` alone (status is a denormalized cache that the hourly `cron.ts` job keeps in sync).

## Language convention

User-facing strings (API messages, AI prompt instructions, AI output reasoning) are in **Bahasa Indonesia**. The `chat.routes.ts` and `signal_engine.py` / `bias_engine.py` prompts explicitly require Indonesian responses with a trading disclaimer. Preserve this when modifying prompts or adding error messages.

## Required environment variables

Backend: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `AI_ENGINE_URL`, `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN`, `CLAUDE_API_KEY`, `CLAUDE_MODEL`, `INTERNAL_API_KEY`, `PORT`.

AI engine: `TWELVE_DATA_API_KEY`, `REDIS_URL`, `CLAUDE_API_KEY`, `CLAUDE_MODEL`, `NEWS_API_KEY`, `FINNHUB_API_KEY`, `BACKEND_URL`, `INTERNAL_API_KEY`, `FRONTEND_URL`.

Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` (both default to `http://localhost:5000`).

`INTERNAL_API_KEY` and `CLAUDE_API_KEY`/`CLAUDE_MODEL` must match between backend and ai-engine.
