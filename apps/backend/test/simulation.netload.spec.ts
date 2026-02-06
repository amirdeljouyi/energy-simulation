import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { SimulationService } from '../src/simulation/simulation.service';
import { AssetType } from '../src/models/asset.models';
import { SimulationInput } from '../src/dto/simulation-input.dto';

const resolveConfigPath = () => {
  const candidates = [
    resolve(process.cwd(), 'src/config/neighborhood.config.json'),
    resolve(process.cwd(), 'apps/backend/src/config/neighborhood.config.json'),
  ];
  const match = candidates.find((candidate) => {
    try {
      return Boolean(readFileSync(candidate));
    } catch {
      return false;
    }
  });
  return match ?? candidates[0];
};

const seasonalTemperature = (month: number) => {
  const radians = ((month + 0.5) / 12) * Math.PI * 2;
  const seasonalSwing = Math.cos(radians);
  return 10 + seasonalSwing * -10;
};

const irradianceFactor = (month: number, temperatureC: number) => {
  const base = 0.45 + Math.sin(((month + 1) / 12) * Math.PI * 2) * 0.35;
  const tempModifier = temperatureC > 15 ? 1.05 : temperatureC < 0 ? 0.9 : 1.0;
  return Math.min(1.0, Math.max(0.1, base * tempModifier));
};

const solarFactor = (hour: number) => {
  const radians = ((hour - 6) / 12) * Math.PI;
  return Math.max(0, Math.sin(radians));
};

const diurnalFactor = (assetType: AssetType, hour: number) => {
  if (assetType === AssetType.HOME_EV_CHARGER) {
    if (hour >= 18 && hour < 23) {
      return 1.2;
    }
    if (hour >= 0 && hour < 6) {
      return 0.3;
    }
    return 0.6;
  }

  if (assetType === AssetType.PUBLIC_EV_CHARGER) {
    if (hour >= 8 && hour < 18) {
      return 1.1;
    }
    return 0.5;
  }

  if (assetType === AssetType.BASE_LOAD) {
    const radians = ((hour - 19) / 24) * Math.PI * 2;
    return 0.7 + 0.3 * ((1 + Math.cos(radians)) / 2);
  }

  return 1;
};

const demandFactor = (temperatureC: number) =>
  Math.min(1.8, Math.max(0.6, (18 - temperatureC) / 12));

describe('Simulation net load with mixed assets', () => {
  const configPath = resolveConfigPath();
  const originalConfig = readFileSync(configPath, 'utf8');

  beforeAll(() => {
    const parsed = JSON.parse(originalConfig) as Record<string, unknown>;
    parsed.houseCount = 2;
    parsed.publicChargerCount = 1;
    parsed.battery = {
      capacityKwh: 0,
      maxPowerKw: 0,
      roundTripEfficiency: 1,
      thresholdKw: 9999,
    };
    writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf8');
  });

  afterAll(() => {
    writeFileSync(configPath, originalConfig, 'utf8');
  });

  it('computes net load with base, heat, EV, and PV assets', () => {
    const service = new SimulationService();
    const startDateTimeIso = '2025-06-15T12:00:00.000Z';
    const endDateTimeIso = '2025-06-15T13:00:00.000Z';

    const input: SimulationInput = {
      clock: {
        startDateTimeIso,
        endDateTimeIso,
        stepMinutes: 60,
      },
      households: [
        {
          id: 'house-1',
          name: 'House 1',
          assets: [
            { id: 'h1-base', type: AssetType.BASE_LOAD, ratedKw: 2 },
            { id: 'h1-heat', type: AssetType.HEAT_PUMP, ratedKw: 1 },
            { id: 'h1-ev', type: AssetType.HOME_EV_CHARGER, ratedKw: 2 },
            { id: 'h1-pv', type: AssetType.PV, ratedKw: 3 },
          ],
        },
        {
          id: 'house-2',
          name: 'House 2',
          assets: [
            { id: 'h2-base', type: AssetType.BASE_LOAD, ratedKw: 1.5 },
            { id: 'h2-pv', type: AssetType.PV, ratedKw: 2 },
          ],
        },
      ],
      publicChargers: [
        { id: 'public-1', type: AssetType.PUBLIC_EV_CHARGER, ratedKw: 5 },
      ],
    };

    const result = service.runSimulation(input);
    const step = result.steps[0];

    const timestamp = new Date(startDateTimeIso);
    const month = timestamp.getUTCMonth();
    const hour = timestamp.getUTCHours();
    const temperatureC = seasonalTemperature(month);
    const irradiance = irradianceFactor(month, temperatureC);

    const baseFactor = diurnalFactor(AssetType.BASE_LOAD, hour);
    const evFactor = diurnalFactor(AssetType.HOME_EV_CHARGER, hour);
    const publicFactor = diurnalFactor(AssetType.PUBLIC_EV_CHARGER, hour);

    const expectedBaseLoadKw = 2 * baseFactor + 1.5 * baseFactor;
    const expectedHomeEvKw = 2 * evFactor;
    const expectedHeatKw = 1 * demandFactor(temperatureC);
    const expectedPublicKw = 5 * publicFactor;
    const expectedPvKw = (3 + 2) * irradiance * solarFactor(hour);

    const expectedLoadKw = expectedBaseLoadKw + expectedHomeEvKw + expectedHeatKw + expectedPublicKw;
    const expectedNetLoad = expectedLoadKw - expectedPvKw;

    expect(step.baseLoadKw).toBeCloseTo(expectedBaseLoadKw, 5);
    expect(step.homeEvKw).toBeCloseTo(expectedHomeEvKw, 5);
    expect(step.heatPumpKw).toBeCloseTo(expectedHeatKw, 5);
    expect(step.publicEvKw).toBeCloseTo(expectedPublicKw, 5);
    expect(step.neighborhoodPvKw).toBeCloseTo(expectedPvKw, 5);
    expect(step.neighborhoodLoadKw).toBeCloseTo(expectedLoadKw, 5);
    expect(step.netLoadKw).toBeCloseTo(expectedNetLoad, 5);

    const house1 = step.householdResults.find((household) => household.householdId === 'house-1');
    const house2 = step.householdResults.find((household) => household.householdId === 'house-2');

    expect(house1?.baseLoadKw).toBeCloseTo(2 * baseFactor, 5);
    expect(house1?.heatPumpKw).toBeCloseTo(expectedHeatKw, 5);
    expect(house1?.homeEvKw).toBeCloseTo(expectedHomeEvKw, 5);
    expect(house1?.pvKw).toBeCloseTo(3 * irradiance * solarFactor(hour), 5);

    expect(house2?.baseLoadKw).toBeCloseTo(1.5 * baseFactor, 5);
    expect(house2?.heatPumpKw).toBeCloseTo(0, 5);
    expect(house2?.homeEvKw).toBeCloseTo(0, 5);
    expect(house2?.pvKw).toBeCloseTo(2 * irradiance * solarFactor(hour), 5);
  });
});
