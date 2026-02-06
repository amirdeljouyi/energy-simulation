import { SimulationService } from '../src/simulation/simulation.service';
import { generateNeighborhoodConfig } from '../src/simulation/neighborhood.generator';
import { AssetType } from '../src/models/asset.models';
import { SimulationInput } from '../src/dto/simulation-input.dto';

const buildInput = (startDateTimeIso: string): SimulationInput => {
  const config = generateNeighborhoodConfig();
  return {
    clock: {
      startDateTimeIso,
      endDateTimeIso: new Date(Date.parse(startDateTimeIso) + 60 * 60 * 1000).toISOString(),
      stepMinutes: 60,
    },
    households: config.households.map((household) => ({
      id: household.id,
      name: household.name,
      assets: household.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        ratedKw: asset.ratedKw,
      })),
    })),
    publicChargers: config.publicChargers.map((charger) => ({
      id: charger.id,
      name: charger.name,
      type: charger.type,
      ratedKw: charger.ratedKw,
    })),
  };
};

const demandFactor = (temperatureC: number) =>
  Math.min(1.8, Math.max(0.6, (18 - temperatureC) / 12));

const irradianceFactor = (month: number, temperatureC: number) => {
  const base = 0.45 + Math.sin(((month + 1) / 12) * Math.PI * 2) * 0.35;
  const tempModifier = temperatureC > 15 ? 1.05 : temperatureC < 0 ? 0.9 : 1.0;
  return Math.min(1.0, Math.max(0.1, base * tempModifier));
};

const seasonalTemperature = (month: number) => {
  const radians = ((month + 0.5) / 12) * Math.PI * 2;
  const seasonalSwing = Math.cos(radians);
  return 10 + seasonalSwing * -10;
};

describe('SimulationService weather impacts', () => {
  it('scales PV and heat pump output based on deterministic weather', () => {
    const service = new SimulationService();
    const input = buildInput('2025-01-15T00:00:00.000Z');
    const result = service.runSimulation(input);

    const step = result.steps[0];
    const month = new Date(input.clock.startDateTimeIso).getUTCMonth();
    const temperatureC = seasonalTemperature(month);
    const expectedIrradiance = irradianceFactor(month, temperatureC);

    expect(step.temperatureC).toBeCloseTo(temperatureC, 5);
    expect(step.irradianceFactor).toBeCloseTo(expectedIrradiance, 5);

    const totalPvKw = input.households
      .flatMap((household) => household.assets)
      .filter((asset) => asset.type === AssetType.PV)
      .reduce((sum, asset) => sum + asset.ratedKw, 0);

    const totalHeatKw = input.households
      .flatMap((household) => household.assets)
      .filter((asset) => asset.type === AssetType.HEAT_PUMP)
      .reduce((sum, asset) => sum + asset.ratedKw, 0);

    const baseLoadKw = input.households
      .flatMap((household) => household.assets)
      .filter((asset) => asset.type !== AssetType.PV && asset.type !== AssetType.HEAT_PUMP)
      .reduce((sum, asset) => sum + asset.ratedKw, 0);

    const expectedPvKw = totalPvKw * expectedIrradiance;
    const expectedHeatKw = totalHeatKw * demandFactor(temperatureC);
    const publicLoadKw = input.publicChargers.reduce((sum, asset) => sum + asset.ratedKw, 0);

    expect(step.neighborhoodPvKw).toBeCloseTo(expectedPvKw, 5);
    expect(step.neighborhoodLoadKw).toBeCloseTo(
      baseLoadKw + expectedHeatKw + publicLoadKw,
      5,
    );
  });
});
