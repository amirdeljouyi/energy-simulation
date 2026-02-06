import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { AssetInput } from './asset.models';

@InputType()
export class HouseholdInput {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => [AssetInput])
  assets!: AssetInput[];
}

@ObjectType()
export class HouseholdStepResult {
  @Field()
  householdId!: string;

  @Field()
  householdName!: string;

  @Field(() => Float)
  loadKw!: number;

  @Field(() => Float)
  pvKw!: number;

  @Field(() => Float)
  netLoadKw!: number;

  @Field(() => Float)
  exportKw!: number;
}

@ObjectType()
export class HouseholdEnergyResult {
  @Field()
  householdId!: string;

  @Field()
  householdName!: string;

  @Field(() => Float)
  loadKwh!: number;

  @Field(() => Float)
  pvKwh!: number;

  @Field(() => Float)
  netLoadKwh!: number;

  @Field(() => Float)
  exportKwh!: number;
}
