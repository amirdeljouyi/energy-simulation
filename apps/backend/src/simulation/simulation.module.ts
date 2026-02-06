import { Module } from '@nestjs/common';
import { SimulationResolver } from './simulation.resolver';
import { SimulationService } from './simulation.service';

@Module({
  providers: [SimulationResolver, SimulationService],
})
export class SimulationModule {}
