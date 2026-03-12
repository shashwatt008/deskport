# DeskPort

Enterprise CLI Tool Sharing Platform — share authenticated CLI tools (Claude Code, AWS CLI, etc.) with team members via browser terminals.

## Architecture
- **Monorepo**: Turborepo + pnpm workspaces
- **apps/web**: Next.js App Router dashboard with shadcn/ui
- **apps/api**: Fastify API + WebSocket relay server
- **packages/agent**: CLI agent that runs on host machine (node-pty + tmux)
- **packages/shared**: Types, tunnel protocol, Zod validators

## Dev Setup
```bash
docker compose -f docker/docker-compose.yml up -d  # postgres, redis, minio
pnpm install
pnpm dev  # starts all packages in dev mode
```

## Key Commands
- `pnpm build` — build all packages
- `pnpm db:push` — push schema to database
- `pnpm db:generate` — generate Drizzle migrations

## Conventions
- All IDs are UUIDs
- API responses use `{ data }` or `{ error }` shape
- WebSocket tunnel protocol defined in packages/shared/src/tunnel-protocol.ts
- Zod validators in packages/shared/src/validators.ts
