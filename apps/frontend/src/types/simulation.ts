export type AssetInput = {
  id: string;
  name?: string;
  type: string;
  ratedKw: number;
  profileKw?: number[];
};

export type HouseholdInput = {
  id: string;
  name: string;
  assets: AssetInput[];
};

export type AssetDistribution = {
  type: string;
  share: number;
  count: number;
};

export type NeighborhoodConfig = {
  seed: number;
  houseCount: number;
  publicChargerCount: number;
  assetDistribution: AssetDistribution[];
  households: HouseholdInput[];
  publicChargers: AssetInput[];
  battery: {
    capacityKwh: number;
    maxPowerKw: number;
    roundTripEfficiency: number;
    thresholdKw: number;
  };
};

export type SimulationClock = {
  startDateTimeIso: string;
  endDateTimeIso: string;
  stepMinutes: number;
};

export type SimulationTotals = {
  neighborhoodImportKwh: number;
  neighborhoodExportKwh: number;
  neighborhoodConsumptionKwh: number;
  neighborhoodPvKwh: number;
  peakLoadKw: number;
  peakLoadWithBatteryKw: number;
};

export type AssetTotals = {
  assetId: string;
  type: string;
  name?: string;
  cumulativeKwh: number;
};

export type HouseholdTotals = {
  householdId: string;
  householdName: string;
  loadKwh: number;
  pvKwh: number;
  netLoadKwh: number;
  exportKwh: number;
};

export type HouseholdStepResult = {
  householdId: string;
  householdName: string;
  baseLoadKw: number;
  heatPumpKw: number;
  homeEvKw: number;
  loadKw: number;
  pvKw: number;
  netLoadKw: number;
  exportKw: number;
};

export type SimulationStep = {
  stepIndex: number;
  timestampIso: string;
  neighborhoodLoadKw: number;
  neighborhoodPvKw: number;
  baseLoadKw: number;
  heatPumpKw: number;
  homeEvKw: number;
  publicEvKw: number;
  netLoadKw: number;
  netLoadWithBatteryKw: number;
  batteryPowerKw: number;
  batterySocKwh: number;
  gridImportKw: number;
  gridExportKw: number;
  season: string;
  temperatureC: number;
  irradianceFactor: number;
  householdResults: HouseholdStepResult[];
};

export type SimulationResult = {
  clock: SimulationClock;
  steps: SimulationStep[];
  householdTotals: HouseholdTotals[];
  totals: SimulationTotals;
  assetTotals: AssetTotals[];
};
