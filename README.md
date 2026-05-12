# OSINT Platform

Modular OSINT intelligence platform — entity search across many providers, investigation workspace, graph relations, alerts, audit logging.

> **Scope.** Public/free sources only. No integrations with stolen credential dumps, leaked-data resellers, or anonymous lookup bots. Telegram = public channels only.

## Stack

| Layer | Tech |
|---|---|
| Web | Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · React Query · Cytoscape · Recharts |
| API | NestJS · TypeScript · Prisma · Zod · Pino · Swagger · Passport JWT · Socket.IO · BullMQ |
| Data | PostgreSQL 16 · Redis 7 · OpenSearch 2 |
| Infra | Docker Compose · nginx · GitHub Actions |

## Layout

```
osint/
├── apps/
│   ├── api/          # NestJS API + Prisma + providers + queues
│   └── web/          # Next.js 14 dashboard
├── packages/
│   ├── types/        # Shared TS types between web & api
│   └── plugin-sdk/   # BaseProvider, retry, rate-limit, circuit-breaker
├── nginx/            # Reverse proxy config
├── docker-compose.yml
└── .env.example
```

## Quickstart (local dev)

Requires: Node ≥ 20.11, pnpm ≥ 9, Docker.

```bash
# 1. Install deps
pnpm install

# 2. Provision env
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL to localhost, add real JWT secrets:
# JWT_ACCESS_SECRET=$(openssl rand -base64 48)
# JWT_REFRESH_SECRET=$(openssl rand -base64 48)

# 3. Bring up data services
docker compose up -d postgres redis opensearch

# 4. Apply schema
pnpm api:generate
pnpm api:migrate

# 5. Run apps
pnpm dev
# api:  http://localhost:4000
# web:  http://localhost:3000
# docs: http://localhost:4000/docs
```

## Full stack via Docker

```bash
cp .env.example .env
docker compose up -d --build
# nginx fronts everything on http://localhost:8080
```

## Provider API keys

All providers are free-tier. Leave the key blank in `.env` to disable a provider.

| Provider | Env var | Free tier | Sign up |
|---|---|---|---|
| Shodan | `SHODAN_API_KEY` | 100/mo (member) | shodan.io |
| VirusTotal | `VIRUSTOTAL_API_KEY` | 500/day | virustotal.com |
| AbuseIPDB | `ABUSEIPDB_API_KEY` | 1000/day | abuseipdb.com |
| HaveIBeenPwned | `HIBP_API_KEY` | $3.50/mo for arbitrary email lookup; free for own email + breach catalog | haveibeenpwned.com |
| Hunter.io | `HUNTER_API_KEY` | 25/mo | hunter.io |
| WHOIS | — | unlimited (RDAP) | — |

## Architecture notes

- **Plugin SDK** — every provider implements `BaseProvider`. Built-in retry with exponential backoff, per-provider token-bucket rate limit, and circuit breaker. Adding a provider = drop a file in `apps/api/src/modules/providers/integrations/` and register it.
- **Enrichment pipeline** — `EntityEnrichmentRequested` → BullMQ job fans out to all matching providers in parallel → `ProviderResult` rows persisted → WS push to subscribed clients → alert engine evaluates watchlists → indexed to OpenSearch.
- **RBAC** — three roles (`ADMIN`, `ANALYST`, `VIEWER`) enforced via `@Roles()` decorator + `RolesGuard`. Per-resource ownership checked in services.
- **Audit log** — every state-changing request is recorded with actor, action, target, IP, correlation ID.
- **2FA** — TOTP enroll/verify scaffold in `auth.controller.ts`; backup codes are a phase-2 item.

## Phase 2 (not in foundation)

File analysis (EXIF/YARA/IOC), MITRE ATT&CK mapping, IOC feed correlation, CLI tool, webhooks, OCR/screenshot service, AI summarization, full Prometheus/Grafana stack.

## Security

- Helmet, CORS allowlist, global rate limit (per-IP) + per-route throttling.
- Argon2/bcrypt for passwords (bcrypt 12 rounds default).
- JWT access (15 min) + refresh (30 days, rotated), session table for revocation.
- All input validated via Zod DTOs.
- Provider API keys never leave the API server — frontend cannot see them.
- All HTTP requests get a correlation ID logged across the request lifecycle.
