# Simulation Assumptions

## Time step
- The simulation uses a discrete, fixed time step defined by `stepMinutes` (defaulted to 15 minutes in the UI).
- 15-minute steps balance granularity for load/PV curves with fast runs for small neighborhoods.
- The clock is explicit: `startDateTimeIso` + `endDateTimeIso` + `stepMinutes` define the full timeline.

## Energy accounting
- Power inputs are in kW; energy per step is computed as `kW * stepHours`.
- Per-asset cumulative energy is tracked since simulation start and returned in `assetTotals`.
- Neighborhood totals include aggregate load, PV generation, grid import, and grid export.

## PV and grid interaction
- PV generation is modeled at the household level.
- PV offsets the same household's load first.
- Any remaining PV becomes grid export.
- Public EV chargers are treated as neighborhood load and are supplied by the grid after household netting.
- Public chargers can have different rated power (deterministic variation per charger).

## Neighborhood battery
- A shared neighborhood battery smooths peaks by discharging above a threshold and charging below a target band.
- Battery power is capped by a max kW limit, and SOC respects capacity.
- Round-trip efficiency is applied to charging/discharging.
## Weather and season
- Weather is deterministic and derived from the simulation timestamp (no external APIs).
- Seasons are month-based: Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn.
- Temperature is modeled as a smooth seasonal curve and drives heat pump demand.
- PV output is scaled by an irradiance factor derived from season and temperature.
- Intraday variability is deterministic:
  - PV uses a daylight curve (zero at night, peak near midday).
  - Base load rises in the evening and dips overnight.
  - Home EV charging skews to evening/night; public charging skews to daytime.

## Neighborhood configuration
- A JSON configuration file defines a fixed seed, counts, and asset distribution.
- House and public charger counts are configurable via the configuration API.
- Assets are distributed deterministically across houses according to the configured shares.
- Configuration file: `apps/backend/src/config/neighborhood.config.json`.
- Default distribution: 40% PV, 30% heat pumps, 20% home EV chargers.
