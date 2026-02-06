import { SimulationService } from '../src/simulation/simulation.service';
import { AssetType } from '../src/models/asset.models';
import { SimulationInput } from '../src/dto/simulation-input.dto';

const buildInput = (): SimulationInput => ({
  clock: {
    startDateTimeIso: '2025-06-01T00:00:00.000Z',
    endDateTimeIso: '2025-06-01T01:00:00.000Z',
    stepMinutes: 60,
  },
  households: Array.from({ length: 30 }, (_, index) => ({
    id: `house-${index + 1}`,
    name: `House ${index + 1}`,
    assets: [
      { id: `house-${index + 1}-base`, type: AssetType.BASE_LOAD, ratedKw: 1 },
    ],
  })),
  publicChargers: Array.from({ length: 6 }, (_, index) => ({
    id: `public-${index + 1}`,
    type: AssetType.PUBLIC_EV_CHARGER,
    ratedKw: 5,
  })),
});

describe('SimulationService basic validation', () => {
  it('rejects endDateTimeIso earlier than start', () => {
    const service = new SimulationService();
    const input = buildInput();
    input.clock.endDateTimeIso = '2025-05-31T23:00:00.000Z';

    expect(() => service.runSimulation(input)).toThrow('endDateTimeIso must be after startDateTimeIso');
  });

  it('rejects households without base load', () => {
    const service = new SimulationService();
    const input = buildInput();
    input.households[0].assets = [];

    expect(() => service.runSimulation(input)).toThrow('must include a BASE_LOAD asset');
  });
});
