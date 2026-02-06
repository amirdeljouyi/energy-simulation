# Design Overview

## Key components and responsibilities
- Backend (NestJS + GraphQL): deterministic simulation engine, neighborhood configuration generator, weather/season modeling, energy accounting, and API exposure.
- Frontend (React): configuration editing, animated playback, chart selector views, and results tables.
- Configuration: JSON-driven neighborhood definition with fixed seed and asset distribution.

## Data model
- Household: `id`, `name`, `assets` (always includes `BASE_LOAD`).
- Asset: `id`, `name`, `type`, `ratedKw`, optional `profileKw`.
- Battery: `capacityKwh`, `maxPowerKw`, `roundTripEfficiency`, `thresholdKw`.
- Simulation clock: `startDateTimeIso`, `endDateTimeIso`, `stepMinutes`.
- Weather snapshot (per step): `season`, `temperatureC`, `irradianceFactor`.
- Results:
  - Per-step: neighborhood load/PV, grid import/export, weather data, and household step metrics.
  - Cumulative totals: per-household kWh, per-asset kWh, and neighborhood totals.
- Simulation outputs are saved as JSON files in `apps/backend/output/` per run.
- Neighborhood battery provides peak shaving with SOC and power limits.

## Assumptions
- EV charging behavior: home and public chargers use deterministic time-of-day profiles.
- PV usage/export: PV offsets household load first; surplus exports to grid.
- Heat pump model: consumption scales with deterministic temperature; colder weather increases load.
- Weather/season: deterministic, month-based seasons with a smooth temperature curve; irradiance is derived from season/temperature.
- Neighborhood configuration: deterministic seeded allocation of assets; exactly 30 houses and 6 public chargers.
- Public charger capacity can vary deterministically per charger.

## Known limitations
- No tariff modeling, demand response, or policy optimization.
- Battery control is rule-based (threshold + charge band), not optimized.
- No tariff modeling, demand response, or policy optimization.
- No persistence for simulation runs; results are computed in-memory.
- UI charts are simple line plots without zoom or export.

## Improvements to consider next
- Add realistic time series for load/EV charging and PV (CSV import + profiles).
- Add storage/battery assets and tariff-aware optimization.
- Persist simulation runs and allow comparison between scenarios.
- Add richer visualizations and downloadable reports.
