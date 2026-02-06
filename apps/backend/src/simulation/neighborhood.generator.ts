import { readFileSync } from 'fs';
import { join } from 'path';
import { AssetType } from '../models/asset.models';
import {
  AssetConfig,
  AssetDistribution,
  HouseholdConfig,
  NeighborhoodConfig,
} from '../models/neighborhood.models';

type RawNeighborhoodConfig = {
  seed: number;
  houseCount: number;
  publicChargerCount: number;
  assetDistribution: Record<string, number>;
  defaults: {
    baseLoadKw: number;
    pvKw: number;
    heatPumpKw: number;
    homeEvKw: number;
    publicEvKw: number;
  };
};

const configPath = join(process.cwd(), 'apps/backend/src/config/neighborhood.config.json');

const loadConfig = (): RawNeighborhoodConfig => {
  const content = readFileSync(configPath, 'utf8');
  return JSON.parse(content) as RawNeighborhoodConfig;
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let value = t;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T>(values: T[], rand: () => number): T[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const computeDistribution = (
  houseCount: number,
  assetDistribution: Record<string, number>,
): AssetDistribution[] => {
  const entries = Object.entries(assetDistribution).map(([type, share]) => ({
    type: type as AssetType,
    share,
    raw: share * houseCount,
  }));

  const withCounts = entries.map((entry) => ({
    ...entry,
    count: Math.floor(entry.raw),
    remainder: entry.raw - Math.floor(entry.raw),
  }));

  let assigned = withCounts.reduce((sum, entry) => sum + entry.count, 0);
  const remaining = houseCount - assigned;

  withCounts
    .sort((a, b) => b.remainder - a.remainder)
    .slice(0, Math.max(0, remaining))
    .forEach((entry) => {
      entry.count += 1;
      assigned += 1;
    });

  return withCounts.map(({ type, share, count }) => ({
    type,
    share,
    count,
  }));
};

export const generateNeighborhoodConfig = (): NeighborhoodConfig => {
  const config = loadConfig();
  const rand = mulberry32(config.seed);

  const distribution = computeDistribution(config.houseCount, config.assetDistribution);
  const houseIndices = shuffle(
    Array.from({ length: config.houseCount }, (_, index) => index),
    rand,
  );

  const assignment: Record<number, AssetType[]> = {};
  distribution.forEach((entry, entryIndex) => {
    const start = distribution.slice(0, entryIndex).reduce((sum, item) => sum + item.count, 0);
    const end = start + entry.count;
    const selected = houseIndices.slice(start, end);
    selected.forEach((index) => {
      if (!assignment[index]) {
        assignment[index] = [];
      }
      assignment[index].push(entry.type);
    });
  });

  const households: HouseholdConfig[] = Array.from({ length: config.houseCount }, (_, index) => {
    const houseId = `house-${index + 1}`;
    const assets: AssetConfig[] = [
      {
        id: `${houseId}-base`,
        name: 'Base Load',
        type: AssetType.BASE_LOAD,
        ratedKw: config.defaults.baseLoadKw,
      },
    ];

    const optionalAssets = assignment[index] ?? [];
    optionalAssets.forEach((assetType) => {
      if (assetType === AssetType.PV) {
        assets.push({
          id: `${houseId}-pv`,
          name: 'PV Array',
          type: AssetType.PV,
          ratedKw: config.defaults.pvKw,
        });
      }
      if (assetType === AssetType.HEAT_PUMP) {
        assets.push({
          id: `${houseId}-heat`,
          name: 'Heat Pump',
          type: AssetType.HEAT_PUMP,
          ratedKw: config.defaults.heatPumpKw,
        });
      }
      if (assetType === AssetType.HOME_EV_CHARGER) {
        assets.push({
          id: `${houseId}-ev`,
          name: 'Home EV Charger',
          type: AssetType.HOME_EV_CHARGER,
          ratedKw: config.defaults.homeEvKw,
        });
      }
    });

    return {
      id: houseId,
      name: `House ${index + 1}`,
      assets,
    };
  });

  const publicChargers: AssetConfig[] = Array.from({ length: config.publicChargerCount }, (_, index) => ({
    id: `public-ev-${index + 1}`,
    name: `Public Charger ${index + 1}`,
    type: AssetType.PUBLIC_EV_CHARGER,
    ratedKw: config.defaults.publicEvKw,
  }));

  return {
    seed: config.seed,
    houseCount: config.houseCount,
    publicChargerCount: config.publicChargerCount,
    assetDistribution: distribution,
    households,
    publicChargers,
  };
};
