import { Field, Float, InputType } from '@nestjs/graphql';
import { AssetType } from '../models/asset.models';

@InputType()
export class AssetInput {
  @Field()
  id!: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => AssetType)
  type!: AssetType;

  @Field(() => Float)
  ratedKw!: number;

  @Field(() => [Float], { nullable: true })
  profileKw?: number[];
}
