import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { AssetType } from './asset.models';

@ObjectType()
export class AssetConfig {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => AssetType)
  type!: AssetType;

  @Field(() => Float)
  ratedKw!: number;
}

@ObjectType()
export class HouseholdConfig {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => [AssetConfig])
  assets!: AssetConfig[];
}

@ObjectType()
export class AssetDistribution {
  @Field(() => AssetType)
  type!: AssetType;

  @Field(() => Float)
  share!: number;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class NeighborhoodConfig {
  @Field(() => Int)
  seed!: number;

  @Field(() => Int)
  houseCount!: number;

  @Field(() => Int)
  publicChargerCount!: number;

  @Field(() => [AssetDistribution])
  assetDistribution!: AssetDistribution[];

  @Field(() => [HouseholdConfig])
  households!: HouseholdConfig[];

  @Field(() => [AssetConfig])
  publicChargers!: AssetConfig[];
}
