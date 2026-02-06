# Product Requirements

## Problem Statement
Model neighborhood energy sharing to understand how local generation and policies impact grid usage and costs.

## User Stories
- As a user, I can define households with PV and battery assets.
- As a user, I can import time series for load and solar profiles.
- As a user, I can run a simulation and see results by household and total.
- As a user, I can watch an animated simulation timeline with weather/season context.
- As a user, I can export results for analysis.

## Non-Functional
- Deterministic runs with reproducible results.
- Clear data validation errors.
- Fast local runs for small neighborhoods (<50 households).

## Data Inputs
- Household load profile.
- PV generation profile.
- Battery parameters (capacity, power).
- Policy toggles (share surplus, grid export).
- Weather/season inputs derived deterministically from the simulation clock.
- Neighborhood configuration with fixed seed, counts, and asset distribution.

## Outputs
- Per-household metrics.
- Aggregate metrics.
- Per-time-step series including simulated time, weather, and net load.
- UI visualization with playback controls and last-24-hours chart.
- Generated neighborhood configuration summary (counts and distributions).
