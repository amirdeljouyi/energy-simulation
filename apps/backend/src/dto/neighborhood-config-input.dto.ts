import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { AssetType } from '../models/asset.models';

@InputType()
export class AssetDistributionInput {
  @Field(() => AssetType)
  type!: AssetType;

  @Field(() => Float)
  share!: number;
}

@InputType()
export class BatteryConfigInput {
  @Field(() => Float)
  capacityKwh!: number;

  @Field(() => Float)
  maxPowerKw!: number;

  @Field(() => Float)
  roundTripEfficiency!: number;

  @Field(() => Float)
  thresholdKw!: number;
}

@InputType()
export class NeighborhoodConfigInput {
  @Field(() => Int, { nullable: true })
  seed?: number;

  @Field(() => Int, { nullable: true })
  houseCount?: number;

  @Field(() => Int, { nullable: true })
  publicChargerCount?: number;

  @Field(() => [AssetDistributionInput], { nullable: true })
  assetDistribution?: AssetDistributionInput[];

  @Field(() => BatteryConfigInput, { nullable: true })
  battery?: BatteryConfigInput;
}
