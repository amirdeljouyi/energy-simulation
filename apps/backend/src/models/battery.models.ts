import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BatteryConfig {
  @Field(() => Float)
  capacityKwh!: number;

  @Field(() => Float)
  maxPowerKw!: number;

  @Field(() => Float)
  roundTripEfficiency!: number;

  @Field(() => Float)
  thresholdKw!: number;
}
