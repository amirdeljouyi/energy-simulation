import { Field, Float, InputType, registerEnumType } from '@nestjs/graphql';

export enum AssetType {
  BASE_LOAD = 'BASE_LOAD',
  HEAT_PUMP = 'HEAT_PUMP',
  PV = 'PV',
  HOME_EV_CHARGER = 'HOME_EV_CHARGER',
  PUBLIC_EV_CHARGER = 'PUBLIC_EV_CHARGER',
}

registerEnumType(AssetType, { name: 'AssetType' });

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
