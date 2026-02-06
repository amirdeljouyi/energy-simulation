# energy-simulation

Neighbour energy simulation with React frontend, NestJS backend, and GraphQL API.

## Quick Start
```bash
npm install
npm run dev
```

## Scripted dev
```bash
./scripts/dev.sh
```

## Docker
```bash
docker compose up --build
```

## Alternative (two terminals)
```bash
npm run dev:backend
npm run dev:frontend
```

## Documentation
- Blueprint: `docs/blueprint.md`
- Architecture: `docs/architecture.md`
- GraphQL Draft: `docs/api-graphql.md`
- Product Requirements: `docs/product-requirements.md`
- Decision Log: `docs/decisions.md`
- Simulation assumptions: `docs/simulation-assumptions.md`
- Design overview: `docs/design-overview.md`

## Tests
```bash
npm --workspace apps/backend test
```
