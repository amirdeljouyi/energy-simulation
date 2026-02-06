import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SimulationInput, SimulationResult } from '../models/simulation.models';
import { SimulationService } from './simulation.service';

@Resolver(() => SimulationResult)
export class SimulationResolver {
  constructor(private readonly simulationService: SimulationService) {}

  @Mutation(() => SimulationResult)
  runSimulation(@Args('input') input: SimulationInput): SimulationResult {
    return this.simulationService.runSimulation(input);
  }
}
