# Architecture Blueprint

## Monorepo Layout
- apps/frontend (React)
- apps/backend (NestJS)
- packages/shared (types, utilities)
- docs (product and technical documentation)

## Frontend (React)
### Responsibilities
- Run simulation (trigger backend mutation).
- Results visualization (charts, tables, metrics).
- Neighbourhood configuration editing (seed, counts, battery, asset shares).

### Key Pages
- Dashboard: neighbourhood, household, public charger views with chart selectors.
- Configuration: seeded neighbourhood settings and asset distribution.

### Core Components
- DashboardViewToggle
- NeighborhoodView / HouseholdView / PublicChargersView
- ChartCard / ChartRenderer / ChartSelect
- SimulationClockPanel

### State Management
- React Query or Apollo Client for GraphQL.
- Local component state for draft configs.

## Backend (NestJS)
### Responsibilities
- Deterministic neighborhood configuration and weather/season modeling.
- Run simulations and return results via GraphQL.
- Basic validation and data normalization.
- Persist JSON outputs per run for inspection.

### Modules
- GraphQLModule (Apollo)
- SimulationModule (core engine)

### Simulation Engine
- Inputs: neighborhood config, assets, simulation clock.
- Time step: compute consumption, PV, weather effects, battery dispatch, grid flow.
- Outputs: per-household metrics + aggregated metrics + battery/peak info.

## Domain Models
- Asset: type, rated power, optional profile.
- Household: name, assets.
- NeighborhoodConfig: seed, house/public counts, asset distribution, battery config.
- BatteryConfig: capacity, max power, efficiency, threshold.
- SimulationClock: start/end time and step size.
- SimulationStepResult: per-step power, weather, battery state, household breakdowns.
- SimulationTotals: aggregate energy and peak metrics.

## Testing
- Jest unit tests cover the neighborhood generator and weather-driven simulation logic.
- Focus on deterministic behavior (seeded distributions, PV/heat-pump scaling).

## Data Storage (Phase 1)
- JSON outputs stored under `apps/backend/output/` for inspection.

## Deployment (Phase 1)
- Local dev with Docker Compose for frontend/backend.
- CI can run lint/test for frontend and backend.
