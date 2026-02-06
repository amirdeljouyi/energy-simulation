import { generateNeighborhoodConfig } from '../src/simulation/neighborhood.generator';
import { AssetType } from '../src/models/asset.models';

describe('Neighborhood generator', () => {
  it('creates deterministic counts and distributions', () => {
    const config = generateNeighborhoodConfig();

    expect(config.houseCount).toBe(30);
    expect(config.publicChargerCount).toBe(6);
    expect(config.households).toHaveLength(30);
    expect(config.publicChargers).toHaveLength(6);

    const counts = config.assetDistribution.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.type] = entry.count;
      return acc;
    }, {});

    expect(counts[AssetType.PV]).toBe(12);
    expect(counts[AssetType.HEAT_PUMP]).toBe(9);
    expect(counts[AssetType.HOME_EV_CHARGER]).toBe(6);

    const pvAssets = config.households.flatMap((household) =>
      household.assets.filter((asset) => asset.type === AssetType.PV),
    );
    const heatAssets = config.households.flatMap((household) =>
      household.assets.filter((asset) => asset.type === AssetType.HEAT_PUMP),
    );
    const homeEvAssets = config.households.flatMap((household) =>
      household.assets.filter((asset) => asset.type === AssetType.HOME_EV_CHARGER),
    );

    expect(pvAssets).toHaveLength(12);
    expect(heatAssets).toHaveLength(9);
    expect(homeEvAssets).toHaveLength(6);

    config.households.forEach((household) => {
      const hasBaseLoad = household.assets.some((asset) => asset.type === AssetType.BASE_LOAD);
      expect(hasBaseLoad).toBe(true);
    });
  });
});
