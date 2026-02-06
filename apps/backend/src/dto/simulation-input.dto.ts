import { Field, InputType, Int } from '@nestjs/graphql';
import { AssetInput } from './asset-input.dto';
import { HouseholdInput } from './household-input.dto';

@InputType()
export class SimulationClockInput {
  @Field()
  startDateTimeIso!: string;

  @Field()
  endDateTimeIso!: string;

  @Field(() => Int)
  stepMinutes!: number;
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
