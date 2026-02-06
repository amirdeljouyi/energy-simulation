import { AssetInput, HouseholdInput } from '../types/simulation';

export const baseHouseholds: HouseholdInput[] = [
  {
    id: 'house-1',
    name: 'Maple House',
    assets: [
      { id: 'house-1-load', type: 'BASE_LOAD', ratedKw: 1.8 },
      { id: 'house-1-heat', type: 'HEAT_PUMP', ratedKw: 1.2 },
      { id: 'house-1-pv', type: 'PV', ratedKw: 2.4 },
      { id: 'house-1-ev', type: 'HOME_EV_CHARGER', ratedKw: 3.6 },
    ],
  },
  {
    id: 'house-2',
    name: 'Cedar House',
    assets: [
      { id: 'house-2-load', type: 'BASE_LOAD', ratedKw: 2.1 },
      { id: 'house-2-pv', type: 'PV', ratedKw: 3.1 },
    ],
  },
  {
    id: 'house-3',
    name: 'Birch House',
    assets: [
      { id: 'house-3-load', type: 'BASE_LOAD', ratedKw: 1.6 },
      { id: 'house-3-heat', type: 'HEAT_PUMP', ratedKw: 1.4 },
    ],
  },
];

const publicChargerVariations = [0.8, 0.95, 1.1, 0.75, 1.2, 0.9];

export const publicChargers: AssetInput[] = Array.from({ length: 6 }, (_, index) => {
  const variation = publicChargerVariations[index] ?? 1;
  return {
    id: `public-ev-${index + 1}`,
    name: `Public Charger ${index + 1}`,
    type: 'PUBLIC_EV_CHARGER',
    ratedKw: Number((7.2 * variation).toFixed(2)),
  };
});
