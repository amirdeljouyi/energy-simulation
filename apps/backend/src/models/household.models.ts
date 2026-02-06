import { Field, Float, ObjectType } from '@nestjs/graphql';

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
