import { Field, InputType } from '@nestjs/graphql';
import { AssetInput } from './asset-input.dto';

@InputType()
export class HouseholdInput {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => [AssetInput])
  assets!: AssetInput[];
}
