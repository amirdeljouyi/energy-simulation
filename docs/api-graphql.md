# GraphQL API Draft

## Schema Overview
- Query: list and fetch core entities.
- Mutation: create/update/delete entities, run simulations.

## Types (Draft)
```graphql
scalar DateTime

type Household {
  id: ID!
  name: String!
  assets: [Asset!]!
}

type Asset {
  id: ID!
  householdId: ID!
  type: AssetType!
  capacityKwh: Float
  powerKw: Float
}

enum AssetType {
  PV
  BATTERY
}

type Policy {
  id: ID!
  name: String!
  shareSurplus: Boolean!
  gridExportEnabled: Boolean!
}

type Dataset {
  id: ID!
  name: String!
  kind: DatasetKind!
  intervalMinutes: Int!
}

enum DatasetKind {
  LOAD
  SOLAR
  BATTERY
}

type SimulationRun {
  id: ID!
  name: String!
  createdAt: DateTime!
  policy: Policy!
  households: [Household!]!
  results: SimulationResult
}

type SimulationResult {
  runId: ID!
  totalGridImportKwh: Float!
  totalGridExportKwh: Float!
  householdResults: [HouseholdResult!]!
}

type HouseholdResult {
  householdId: ID!
  selfConsumedKwh: Float!
  sharedKwh: Float!
  gridImportKwh: Float!
  gridExportKwh: Float!
}

input AssetInput {
  type: AssetType!
  capacityKwh: Float
  powerKw: Float
}

input HouseholdInput {
  name: String!
  assets: [AssetInput!]!
}

input PolicyInput {
  name: String!
  shareSurplus: Boolean!
  gridExportEnabled: Boolean!
}

input DatasetInput {
  name: String!
  kind: DatasetKind!
  intervalMinutes: Int!
}

type Query {
  households: [Household!]!
  household(id: ID!): Household
  policies: [Policy!]!
  datasets: [Dataset!]!
  simulationRuns: [SimulationRun!]!
  simulationRun(id: ID!): SimulationRun
}

type Mutation {
  createHousehold(input: HouseholdInput!): Household!
  createPolicy(input: PolicyInput!): Policy!
  createDataset(input: DatasetInput!): Dataset!
  runSimulation(name: String!, householdIds: [ID!]!, policyId: ID!): SimulationRun!
}
```

## Notes
- Timeseries data upload can be a REST endpoint or GraphQL upload (Phase 2).
- Result time series can be added once the UI needs per-slot charts.

## Implemented (Phase 1)
```graphql
enum AssetType {
  BASE_LOAD
  HEAT_PUMP
  PV
  HOME_EV_CHARGER
  PUBLIC_EV_CHARGER
}

enum Season {
  WINTER
  SPRING
  SUMMER
  AUTUMN
}

input SimulationClockInput {
  startDateTimeIso: String!
  endDateTimeIso: String!
  stepMinutes: Int!
}

input AssetInput {
  id: ID!
  name: String
  type: AssetType!
  ratedKw: Float!
  profileKw: [Float!]
}

input HouseholdInput {
  id: ID!
  name: String!
  assets: [AssetInput!]!
}

input SimulationInput {
  clock: SimulationClockInput!
  households: [HouseholdInput!]!
  publicChargers: [AssetInput!]!
}

type SimulationClock {
  startDateTimeIso: String!
  endDateTimeIso: String!
  stepMinutes: Int!
}

type SimulationStepResult {
  stepIndex: Int!
  timestampIso: String!
  neighborhoodLoadKw: Float!
  neighborhoodPvKw: Float!
  baseLoadKw: Float!
  heatPumpKw: Float!
  homeEvKw: Float!
  publicEvKw: Float!
  netLoadKw: Float!
  netLoadWithBatteryKw: Float!
  batteryPowerKw: Float!
  batterySocKwh: Float!
  gridImportKw: Float!
  gridExportKw: Float!
  season: Season!
  temperatureC: Float!
  irradianceFactor: Float!
  householdResults: [HouseholdStepResult!]!
}

type HouseholdStepResult {
  householdId: ID!
  householdName: String!
  baseLoadKw: Float!
  heatPumpKw: Float!
  homeEvKw: Float!
  loadKw: Float!
  pvKw: Float!
  netLoadKw: Float!
  exportKw: Float!
}

type HouseholdEnergyResult {
  householdId: ID!
  householdName: String!
  loadKwh: Float!
  pvKwh: Float!
  netLoadKwh: Float!
  exportKwh: Float!
}

type AssetEnergyResult {
  assetId: ID!
  type: AssetType!
  name: String
  cumulativeKwh: Float!
}

type SimulationTotals {
  neighborhoodImportKwh: Float!
  neighborhoodExportKwh: Float!
  neighborhoodConsumptionKwh: Float!
  neighborhoodPvKwh: Float!
  peakLoadKw: Float!
  peakLoadWithBatteryKw: Float!
}

type SimulationResult {
  clock: SimulationClock!
  steps: [SimulationStepResult!]!
  householdTotals: [HouseholdEnergyResult!]!
  assetTotals: [AssetEnergyResult!]!
  totals: SimulationTotals!
}

type AssetConfig {
  id: ID!
  name: String
  type: AssetType!
  ratedKw: Float!
}

type HouseholdConfig {
  id: ID!
  name: String!
  assets: [AssetConfig!]!
}

type AssetDistribution {
  type: AssetType!
  share: Float!
  count: Int!
}

type NeighborhoodConfig {
  seed: Int!
  houseCount: Int!
  publicChargerCount: Int!
  battery: BatteryConfig!
  assetDistribution: [AssetDistribution!]!
  households: [HouseholdConfig!]!
  publicChargers: [AssetConfig!]!
}

type BatteryConfig {
  capacityKwh: Float!
  maxPowerKw: Float!
  roundTripEfficiency: Float!
  thresholdKw: Float!
}

type Mutation {
  runSimulation(input: SimulationInput!): SimulationResult!
}

type Query {
  neighborhoodConfig: NeighborhoodConfig!
}

input AssetDistributionInput {
  type: AssetType!
  share: Float!
}

input BatteryConfigInput {
  capacityKwh: Float!
  maxPowerKw: Float!
  roundTripEfficiency: Float!
  thresholdKw: Float!
}

input NeighborhoodConfigInput {
  seed: Int
  houseCount: Int
  publicChargerCount: Int
  assetDistribution: [AssetDistributionInput!]
  battery: BatteryConfigInput
}

type Mutation {
  updateNeighborhoodConfig(input: NeighborhoodConfigInput!): NeighborhoodConfig!
}
```
