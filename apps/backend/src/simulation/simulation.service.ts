import { BadRequestException, Injectable } from '@nestjs/common';
import {
  SimulationResult,
  SimulationStepResult,
  SimulationTotals,
  Season,
} from '../models/simulation.models';
import { AssetType } from '../models/asset.models';
import { AssetInput } from '../dto/asset-input.dto';
import { SimulationInput } from '../dto/simulation-input.dto';
import { HouseholdEnergyResult, HouseholdStepResult } from '../models/household.models';
import { NeighborhoodConfig } from '../models/neighborhood.models';
import { generateNeighborhoodConfig } from './neighborhood.generator';

interface AssetAccumulator {
  assetId: string;
  type: AssetType;
  name?: string;
  cumulativeKwh: number;
}

type HouseholdAccumulator = HouseholdEnergyResult;

@Injectable()
export class SimulationService {
  getNeighborhoodConfig(): NeighborhoodConfig {
    return generateNeighborhoodConfig();
  }

  runSimulation(input: SimulationInput): SimulationResult {
    this.validateInput(input);

    const { clock, households, publicChargers } = input;
    const startTime = new Date(clock.startDateTimeIso);
    const stepHours = clock.stepMinutes / 60;

    const assetAccumulators = new Map<string, AssetAccumulator>();
    const registerAsset = (asset: AssetInput) => {
      if (!assetAccumulators.has(asset.id)) {
        assetAccumulators.set(asset.id, {
          assetId: asset.id,
          type: asset.type,
          name: asset.name,
          cumulativeKwh: 0,
        });
      }
    };

    households.forEach((household) => household.assets.forEach(registerAsset));
    publicChargers.forEach(registerAsset);

    const steps: SimulationStepResult[] = [];
    let neighborhoodImportKwh = 0;
    let neighborhoodExportKwh = 0;
    let neighborhoodConsumptionKwh = 0;
    let neighborhoodPvKwh = 0;
    const householdAccumulators: HouseholdAccumulator[] = households.map((household) => ({
      householdId: household.id,
      householdName: household.name,
      loadKwh: 0,
      pvKwh: 0,
      netLoadKwh: 0,
      exportKwh: 0,
    }));

    for (let stepIndex = 0; stepIndex < clock.steps; stepIndex += 1) {
      const timestampDate = new Date(
        startTime.getTime() + stepIndex * clock.stepMinutes * 60 * 1000,
      );
      const timestampIso = timestampDate.toISOString();
      const weather = this.getWeatherSnapshot(timestampDate);

      let neighborhoodLoadKw = 0;
      let neighborhoodPvKw = 0;
      let gridImportKw = 0;
      let gridExportKw = 0;

      const householdResults: HouseholdStepResult[] = households.map((household, householdIndex) => {
        const loadKw = this.sumAssetPower(
          household.assets,
          stepIndex,
          false,
          assetAccumulators,
          stepHours,
          weather,
        );
        const pvKw = this.sumAssetPower(
          household.assets,
          stepIndex,
          true,
          assetAccumulators,
          stepHours,
          weather,
        );

        const netLoadKw = Math.max(loadKw - pvKw, 0);
        const exportKw = Math.max(pvKw - loadKw, 0);

        neighborhoodLoadKw += loadKw;
        neighborhoodPvKw += pvKw;
        gridImportKw += netLoadKw;
        gridExportKw += exportKw;

        const accumulator = householdAccumulators[householdIndex];
        accumulator.loadKwh += loadKw * stepHours;
        accumulator.pvKwh += pvKw * stepHours;
        accumulator.netLoadKwh += netLoadKw * stepHours;
        accumulator.exportKwh += exportKw * stepHours;

        return {
          householdId: household.id,
          householdName: household.name,
          loadKw,
          pvKw,
          netLoadKw,
          exportKw,
        };
      });

      const publicLoadKw = this.sumAssetPower(
        publicChargers,
        stepIndex,
        false,
        assetAccumulators,
        stepHours,
        weather,
      );
      neighborhoodLoadKw += publicLoadKw;
      gridImportKw += publicLoadKw;

      const stepImportKwh = gridImportKw * stepHours;
      const stepExportKwh = gridExportKw * stepHours;
      const stepConsumptionKwh = neighborhoodLoadKw * stepHours;
      const stepPvKwh = neighborhoodPvKw * stepHours;

      neighborhoodImportKwh += stepImportKwh;
      neighborhoodExportKwh += stepExportKwh;
      neighborhoodConsumptionKwh += stepConsumptionKwh;
      neighborhoodPvKwh += stepPvKwh;

      steps.push({
        stepIndex,
        timestampIso,
        neighborhoodLoadKw,
        neighborhoodPvKw,
        gridImportKw,
        gridExportKw,
        season: weather.season,
        temperatureC: weather.temperatureC,
        irradianceFactor: weather.irradianceFactor,
        householdResults,
      });
    }

    const totals: SimulationTotals = {
      neighborhoodImportKwh,
      neighborhoodExportKwh,
      neighborhoodConsumptionKwh,
      neighborhoodPvKwh,
    };

    return {
      clock,
      steps,
      householdTotals: householdAccumulators,
      assetTotals: Array.from(assetAccumulators.values()),
      totals,
    };
  }

  private sumAssetPower(
    assets: AssetInput[],
    stepIndex: number,
    includePv: boolean,
    accumulators: Map<string, AssetAccumulator>,
    stepHours: number,
    weather?: { temperatureC: number; irradianceFactor: number },
  ): number {
    return assets.reduce((total, asset) => {
      const isPv = asset.type === AssetType.PV;
      if (includePv !== isPv) {
        return total;
      }

      const kw = this.resolveAssetKw(asset, stepIndex, weather);
      const accumulator = accumulators.get(asset.id);
      if (accumulator) {
        accumulator.cumulativeKwh += kw * stepHours;
      }

      return total + kw;
    }, 0);
  }

  private resolveAssetKw(
    asset: AssetInput,
    stepIndex: number,
    weather?: { temperatureC: number; irradianceFactor: number },
  ): number {
    if (asset.profileKw && asset.profileKw.length > 0) {
      const baseKw = asset.profileKw[stepIndex] ?? asset.ratedKw;
      return this.applyWeather(asset.type, baseKw, weather);
    }
    return this.applyWeather(asset.type, asset.ratedKw, weather);
  }

  private applyWeather(
    assetType: AssetType,
    baseKw: number,
    weather?: { temperatureC: number; irradianceFactor: number },
  ): number {
    if (!weather) {
      return baseKw;
    }

    if (assetType === AssetType.PV) {
      return baseKw * weather.irradianceFactor;
    }

    if (assetType === AssetType.HEAT_PUMP) {
      const demandFactor = Math.min(1.8, Math.max(0.6, (18 - weather.temperatureC) / 12));
      return baseKw * demandFactor;
    }

    return baseKw;
  }

  private getWeatherSnapshot(timestamp: Date): {
    season: Season;
    temperatureC: number;
    irradianceFactor: number;
  } {
    const month = timestamp.getUTCMonth();
    const season = this.getSeason(month);
    const temperatureC = this.getSeasonalTemperature(month);
    const irradianceFactor = this.getSeasonalIrradiance(month, temperatureC);

    return { season, temperatureC, irradianceFactor };
  }

  private getSeason(month: number): Season {
    if (month <= 1 || month === 11) {
      return Season.WINTER;
    }
    if (month >= 2 && month <= 4) {
      return Season.SPRING;
    }
    if (month >= 5 && month <= 7) {
      return Season.SUMMER;
    }
    return Season.AUTUMN;
  }

  private getSeasonalTemperature(month: number): number {
    const radians = ((month + 0.5) / 12) * Math.PI * 2;
    const seasonalSwing = Math.cos(radians);
    return 10 + seasonalSwing * -10;
  }

  private getSeasonalIrradiance(month: number, temperatureC: number): number {
    const base = 0.45 + Math.sin(((month + 1) / 12) * Math.PI * 2) * 0.35;
    const tempModifier = temperatureC > 15 ? 1.05 : temperatureC < 0 ? 0.9 : 1.0;
    return Math.min(1.0, Math.max(0.1, base * tempModifier));
  }

  private validateInput(input: SimulationInput): void {
    if (input.clock.stepMinutes <= 0) {
      throw new BadRequestException('stepMinutes must be greater than zero');
    }
    if (input.clock.steps <= 0) {
      throw new BadRequestException('steps must be greater than zero');
    }
    if (Number.isNaN(Date.parse(input.clock.startDateTimeIso))) {
      throw new BadRequestException('startDateTimeIso must be a valid ISO timestamp');
    }

    input.households.forEach((household) => {
      const hasBaseLoad = household.assets.some(
        (asset) => asset.type === AssetType.BASE_LOAD,
      );
      if (!hasBaseLoad) {
        throw new BadRequestException(
          `household ${household.id} must include a BASE_LOAD asset`,
        );
      }
    });

    if (input.households.length !== 30) {
      throw new BadRequestException('households must include 30 entries');
    }

    if (input.publicChargers.length !== 6) {
      throw new BadRequestException('publicChargers must include 6 assets');
    }

    input.publicChargers.forEach((asset) => {
      if (asset.type !== AssetType.PUBLIC_EV_CHARGER) {
        throw new BadRequestException('publicChargers assets must be PUBLIC_EV_CHARGER type');
      }
    });
  }
}
