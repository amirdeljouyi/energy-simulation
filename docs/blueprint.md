# Neighbour Energy Simulation Blueprint

## Goals
- Model energy production, consumption, and sharing among neighbors.
- Provide a clear simulation timeline (hourly or 15-min slots).
- Expose a GraphQL API for configuration, simulation runs, and results.
- Provide a React UI for configuring inputs, animated playback, and visualizing outputs.
- Keep all documentation versioned in-repo.

## Scope (Phase 1)
- Single neighborhood with multiple households.
- Deterministic profiles and diurnal patterns for loads and PV.
- Simple policy rules (self-consume, grid import/export).
- Deterministic simulation (no stochastic weather yet).
- Deterministic weather + season factors that affect PV and heat pump demand.
- Neighbourhood battery with peak shaving control.

## Core Concepts
- Household: energy consumer/producer with assets (PV, battery).
- SimulationRun: configuration + input datasets + policy.
- TimeStep: discrete slot with computed energy flows.
- Policy: rules for sharing and grid interaction.
- NeighborhoodConfig: seed, counts, distribution, battery config.

## Primary Users
- Researcher analyzing energy sharing effects.
- City planner evaluating policies.
- Student learning energy systems.

## Success Criteria
- User can create a simulation run in <5 minutes.
- Results include per-household and aggregated metrics.
- UI renders charts for energy flows and cost summary.
- UI includes animated simulation playback and a last-24-hours net-load chart.
- UI provides selectable charts for neighbourhood, household, and public chargers.

## Deliverables
- React frontend blueprint and module plan.
- NestJS backend blueprint and module plan.
- GraphQL schema draft.
- Documentation index and decision log.
