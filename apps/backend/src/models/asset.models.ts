import { registerEnumType } from '@nestjs/graphql';

export enum AssetType {
  BASE_LOAD = 'BASE_LOAD',
  HEAT_PUMP = 'HEAT_PUMP',
  PV = 'PV',
  HOME_EV_CHARGER = 'HOME_EV_CHARGER',
  PUBLIC_EV_CHARGER = 'PUBLIC_EV_CHARGER',
}

registerEnumType(AssetType, { name: 'AssetType' });
