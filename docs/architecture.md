# Architecture Blueprint

## Monorepo Layout
- apps/frontend (React)
- apps/backend (NestJS)
- packages/shared (types, utilities)
- docs (product and technical documentation)

## Frontend (React)
### Responsibilities
- Scenario setup (households, assets, policies, time series upload).
- Run simulation (trigger backend mutation).
- Results visualization (charts, tables, metrics).
- Documentation access (link to docs pages).

### Key Pages
- Home: overview, recent runs.
- Scenario Builder: household list, asset config, policy config.
- Data Import: upload CSVs for load/solar/battery profiles.
- Run Detail: charts, flows, cost summary, export.
- Docs: embedded links to docs.

### Core Components
- HouseholdForm
- AssetConfigPanel
- PolicySelector
- TimeseriesUploader
- SimulationRunButton
- ResultsDashboard
- ChartPanel (energy flow, SOC, grid import/export)

### State Management
- React Query or Apollo Client for GraphQL.
- Local component state for draft configs.

## Backend (NestJS)
### Responsibilities
- CRUD for households, assets, policies, datasets.
- Run simulations and store results.
- Provide GraphQL API and schema.
- Basic validation and data normalization.
- Provide deterministic neighborhood configuration and weather/season modeling.

### Modules
- GraphQLModule (Apollo)
- SimulationModule (core engine)
- HouseholdsModule
- AssetsModule
- PoliciesModule
- DatasetsModule (timeseries)
- RunsModule (persisted simulation runs)
- AuthModule (Phase 2)

### Simulation Engine (Phase 1)
- Inputs: households, assets, datasets, policy.
- Time step: compute self-consumption, share surplus, grid flow.
- Outputs: per-household metrics + aggregated metrics.

## Testing
- Jest unit tests cover the neighborhood generator and weather-driven simulation logic.
- Focus on deterministic behavior (seeded distributions, PV/heat-pump scaling).

## Data Storage (Phase 1)
- PostgreSQL (preferred) or SQLite for local dev.
- Timeseries stored as table rows or JSON blobs (Phase 1).

## Deployment (Phase 1)
- Local dev with docker-compose for DB.
- CI to run lint/test for frontend and backend.
