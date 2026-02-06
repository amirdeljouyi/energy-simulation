import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { HealthResolver } from './health.resolver';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/backend/src/schema.gql'),
      playground: true,
    }),
    SimulationModule,
  ],
  providers: [HealthResolver],
})
export class AppModule {}
