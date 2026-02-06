import { Field, Float, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AssetInput, AssetType } from './asset.models';
import { HouseholdEnergyResult, HouseholdInput, HouseholdStepResult } from './household.models';

export enum Season {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  AUTUMN = 'AUTUMN',
}

registerEnumType(Season, { name: 'Season' });

@InputType()
export class SimulationClockInput {
  @Field()
  startDateTimeIso!: string;

  @Field(() => Int)
  stepMinutes!: number;

  @Field(() => Int)
  steps!: number;
}

@ObjectType()
export class SimulationClock {
  @Field()
  startDateTimeIso!: string;

  @Field(() => Int)
  stepMinutes!: number;

  @Field(() => Int)
  steps!: number;
}

@InputType()
export class SimulationInput {
  @Field(() => SimulationClockInput)
  clock!: SimulationClockInput;

  @Field(() => [HouseholdInput])
  households!: HouseholdInput[];

  @Field(() => [AssetInput])
  publicChargers!: AssetInput[];
}

@ObjectType()
export class AssetEnergyResult {
  @Field()
  assetId!: string;

  @Field(() => AssetType)
  type!: AssetType;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Float)
  cumulativeKwh!: number;
}

@ObjectType()
export class SimulationStepResult {
  @Field(() => Int)
  stepIndex!: number;

  @Field()
  timestampIso!: string;

  @Field(() => Float)
  neighborhoodLoadKw!: number;

  @Field(() => Float)
  neighborhoodPvKw!: number;

  @Field(() => Float)
  gridImportKw!: number;

  @Field(() => Float)
  gridExportKw!: number;

  @Field(() => Season)
  season!: Season;

  @Field(() => Float)
  temperatureC!: number;

  @Field(() => Float)
  irradianceFactor!: number;

  @Field(() => [HouseholdStepResult])
  householdResults!: HouseholdStepResult[];
}

@ObjectType()
export class SimulationTotals {
  @Field(() => Float)
  neighborhoodImportKwh!: number;

  @Field(() => Float)
  neighborhoodExportKwh!: number;

  @Field(() => Float)
  neighborhoodConsumptionKwh!: number;

  @Field(() => Float)
  neighborhoodPvKwh!: number;
}

@ObjectType()
export class SimulationResult {
  @Field(() => SimulationClock)
  clock!: SimulationClock;

  @Field(() => [SimulationStepResult])
  steps!: SimulationStepResult[];

  @Field(() => [HouseholdEnergyResult])
  householdTotals!: HouseholdEnergyResult[];

  @Field(() => [AssetEnergyResult])
  assetTotals!: AssetEnergyResult[];

  @Field(() => SimulationTotals)
  totals!: SimulationTotals;
}
