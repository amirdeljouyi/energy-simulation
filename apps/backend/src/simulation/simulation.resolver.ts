import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SimulationResult } from '../models/simulation.models';
import { SimulationInput } from '../dto/simulation-input.dto';
import { SimulationService } from './simulation.service';
import { NeighborhoodConfig } from '../models/neighborhood.models';
import { NeighborhoodConfigInput } from '../dto/neighborhood-config-input.dto';

@Resolver(() => SimulationResult)
export class SimulationResolver {
  constructor(private readonly simulationService: SimulationService) {}

  @Query(() => NeighborhoodConfig)
  neighborhoodConfig(): NeighborhoodConfig {
    return this.simulationService.getNeighborhoodConfig();
  }

  @Mutation(() => NeighborhoodConfig)
  updateNeighborhoodConfig(
    @Args('input') input: NeighborhoodConfigInput,
  ): NeighborhoodConfig {
    return this.simulationService.updateNeighborhoodConfig(input);
  }

  @Mutation(() => SimulationResult)
  runSimulation(@Args('input') input: SimulationInput): SimulationResult {
    return this.simulationService.runSimulation(input);
  }
}
