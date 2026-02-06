# Simulation Assumptions

## Time step
- The simulation uses a discrete, fixed time step defined by `stepMinutes`.
- Default guidance: 15-minute steps balance granularity for load/PV curves with fast runs for small neighborhoods.
- The clock is explicit: `startDateTimeIso` + `stepMinutes` + `steps` define the full timeline.

## Energy accounting
- Power inputs are in kW; energy per step is computed as `kW * stepHours`.
- Per-asset cumulative energy is tracked since simulation start and returned in `assetTotals`.
- Neighborhood totals include aggregate load, PV generation, grid import, and grid export.

## PV and grid interaction
- PV generation is modeled at the household level.
- PV offsets the same household's load first.
- Any remaining PV becomes grid export.
- Public EV chargers are treated as neighborhood load and are supplied by the grid after household netting.

## Weather and season
- Weather is deterministic and derived from the simulation timestamp (no external APIs).
- Seasons are month-based: Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov autumn.
- Temperature is modeled as a smooth seasonal curve and drives heat pump demand.
- PV output is scaled by an irradiance factor derived from season and temperature.
