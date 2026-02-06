import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
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
import { generateNeighborhoodConfig, updateNeighborhoodConfig } from './neighborhood.generator';

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

  updateNeighborhoodConfig(update: {
    seed?: number;
    houseCount?: number;
    publicChargerCount?: number;
    assetDistribution?: { type: AssetType; share: number }[];
    battery?: {
      capacityKwh: number;
      maxPowerKw: number;
      roundTripEfficiency: number;
      thresholdKw: number;
    };
  }): NeighborhoodConfig {
    return updateNeighborhoodConfig(update);
  }

  runSimulation(input: SimulationInput): SimulationResult {
    this.validateInput(input);

    const { clock, households, publicChargers } = input;
    const startTime = new Date(clock.startDateTimeIso);
    const endTime = new Date(clock.endDateTimeIso);
    const stepHours = clock.stepMinutes / 60;
    const stepMs = clock.stepMinutes * 60 * 1000;
    const totalSteps = Math.round((endTime.getTime() - startTime.getTime()) / stepMs);

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
    let peakLoadKw = 0;
    let peakLoadWithBatteryKw = 0;
    const neighborhoodConfig = this.getNeighborhoodConfig();
    const batteryCapacityKwh = neighborhoodConfig.battery.capacityKwh;
    const batteryMaxPowerKw = neighborhoodConfig.battery.maxPowerKw;
    const batteryEfficiency = Math.min(
      1,
      Math.max(0.1, neighborhoodConfig.battery.roundTripEfficiency),
    );
    const batteryThresholdKw = neighborhoodConfig.battery.thresholdKw;
    let batterySocKwh = batteryCapacityKwh * 0.5;
    const householdAccumulators: HouseholdAccumulator[] = households.map((household) => ({
      householdId: household.id,
      householdName: household.name,
      loadKwh: 0,
      pvKwh: 0,
      netLoadKwh: 0,
      exportKwh: 0,
    }));

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex += 1) {
      const timestampDate = new Date(
        startTime.getTime() + stepIndex * stepMs,
      );
      const timestampIso = timestampDate.toISOString();
      const weather = this.getWeatherSnapshot(timestampDate);

      let neighborhoodLoadKw = 0;
      let neighborhoodPvKw = 0;
      let baseLoadKw = 0;
      let heatPumpKw = 0;
      let homeEvKw = 0;
      let gridImportKw = 0;
      let gridExportKw = 0;

      const householdResults: HouseholdStepResult[] = households.map((household, householdIndex) => {
        let householdBaseKw = 0;
        let householdHeatKw = 0;
        let householdEvKw = 0;
        let householdPvKw = 0;

        household.assets.forEach((asset) => {
          const kw = this.computeAssetKw(
            asset,
            stepIndex,
            stepHours,
            weather,
            timestampDate,
            assetAccumulators,
          );
          if (asset.type === AssetType.PV) {
            householdPvKw += kw;
          } else if (asset.type === AssetType.BASE_LOAD) {
            householdBaseKw += kw;
          } else if (asset.type === AssetType.HEAT_PUMP) {
            householdHeatKw += kw;
          } else if (asset.type === AssetType.HOME_EV_CHARGER) {
            householdEvKw += kw;
          } else {
            householdBaseKw += kw;
          }
        });

        const loadKw = householdBaseKw + householdHeatKw + householdEvKw;
        const pvKw = householdPvKw;

        const netLoadKw = Math.max(loadKw - pvKw, 0);
        const exportKw = Math.max(pvKw - loadKw, 0);

        neighborhoodLoadKw += loadKw;
        neighborhoodPvKw += pvKw;
        baseLoadKw += householdBaseKw;
        heatPumpKw += householdHeatKw;
        homeEvKw += householdEvKw;
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
          baseLoadKw: householdBaseKw,
          heatPumpKw: householdHeatKw,
          homeEvKw: householdEvKw,
          loadKw,
          pvKw,
          netLoadKw,
          exportKw,
        };
      });

      const publicLoadKw = publicChargers.reduce((total, asset) => {
        const kw = this.computeAssetKw(
          asset,
          stepIndex,
          stepHours,
          weather,
          timestampDate,
          assetAccumulators,
        );
        return total + kw;
      }, 0);
      neighborhoodLoadKw += publicLoadKw;
      gridImportKw += publicLoadKw;

      const netLoadKw = neighborhoodLoadKw - neighborhoodPvKw;
      peakLoadKw = Math.max(peakLoadKw, netLoadKw);

      const batteryDispatch = this.dispatchBattery({
        netLoadKw,
        batterySocKwh,
        batteryCapacityKwh,
        batteryMaxPowerKw,
        batteryEfficiency,
        thresholdKw: batteryThresholdKw,
        stepHours,
      });

      batterySocKwh = batteryDispatch.nextSocKwh;
      const netLoadWithBatteryKw = netLoadKw - batteryDispatch.batteryPowerKw;
      peakLoadWithBatteryKw = Math.max(peakLoadWithBatteryKw, netLoadWithBatteryKw);

      const adjustedImportKw = Math.max(netLoadWithBatteryKw, 0);
      const adjustedExportKw = Math.max(-netLoadWithBatteryKw, 0);

      const stepImportKwh = adjustedImportKw * stepHours;
      const stepExportKwh = adjustedExportKw * stepHours;
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
        baseLoadKw,
        heatPumpKw,
        homeEvKw,
        publicEvKw: publicLoadKw,
        netLoadKw,
        netLoadWithBatteryKw,
        batteryPowerKw: batteryDispatch.batteryPowerKw,
        batterySocKwh,
        gridImportKw: adjustedImportKw,
        gridExportKw: adjustedExportKw,
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
      peakLoadKw,
      peakLoadWithBatteryKw,
    };

    const result: SimulationResult = {
      clock,
      steps,
      householdTotals: householdAccumulators,
      assetTotals: Array.from(assetAccumulators.values()),
      totals,
    };

    this.persistResults(result);

    return result;
  }

  private persistResults(result: SimulationResult): void {
    const outputDir = join(process.cwd(), 'output');
    mkdirSync(outputDir, { recursive: true });

    const publicAssetTotals = result.assetTotals.filter(
      (asset) => asset.type === AssetType.PUBLIC_EV_CHARGER,
    );

    const payload = {
      generatedAtIso: new Date().toISOString(),
      clock: result.clock,
      totals: result.totals,
      steps: result.steps,
      householdTotals: result.householdTotals,
      publicAssetTotals,
    };

    const filename = `simulation-${Date.now()}.json`;
    const filePath = join(outputDir, filename);
    writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  private computeAssetKw(
    asset: AssetInput,
    stepIndex: number,
    stepHours: number,
    weather?: { temperatureC: number; irradianceFactor: number },
    timestamp?: Date,
    accumulators?: Map<string, AssetAccumulator>,
  ): number {
    if (asset.profileKw && asset.profileKw.length > 0) {
      const baseKw = asset.profileKw[stepIndex] ?? asset.ratedKw;
      const kw = this.applyWeather(asset.type, baseKw, weather, timestamp);
      if (accumulators) {
        const accumulator = accumulators.get(asset.id);
        if (accumulator) {
          accumulator.cumulativeKwh += kw * stepHours;
        }
      }
      return kw;
    }
    const kw = this.applyWeather(asset.type, asset.ratedKw, weather, timestamp);
    if (accumulators) {
      const accumulator = accumulators.get(asset.id);
      if (accumulator) {
        accumulator.cumulativeKwh += kw * stepHours;
      }
    }
    return kw;
  }

  private applyWeather(
    assetType: AssetType,
    baseKw: number,
    weather?: { temperatureC: number; irradianceFactor: number },
    timestamp?: Date,
  ): number {
    const timeFactor = timestamp ? this.getDiurnalFactor(assetType, timestamp) : 1;
    const adjustedKw = baseKw * timeFactor;

    if (!weather) {
      return adjustedKw;
    }

    if (assetType === AssetType.PV) {
      const solarFactor = timestamp ? this.getSolarFactor(timestamp) : 1;
      return adjustedKw * weather.irradianceFactor * solarFactor;
    }

    if (assetType === AssetType.HEAT_PUMP) {
      const demandFactor = Math.min(1.8, Math.max(0.6, (18 - weather.temperatureC) / 12));
      return adjustedKw * demandFactor;
    }

    return adjustedKw;
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

  private getSolarFactor(timestamp: Date): number {
    const hour = timestamp.getUTCHours() + timestamp.getUTCMinutes() / 60;
    const radians = ((hour - 6) / 12) * Math.PI;
    return Math.max(0, Math.sin(radians));
  }

  private getDiurnalFactor(assetType: AssetType, timestamp: Date): number {
    const hour = timestamp.getUTCHours() + timestamp.getUTCMinutes() / 60;

    if (assetType === AssetType.HOME_EV_CHARGER) {
      if (hour >= 18 && hour < 23) {
        return 1.2;
      }
      if (hour >= 0 && hour < 6) {
        return 0.3;
      }
      return 0.6;
    }

    if (assetType === AssetType.PUBLIC_EV_CHARGER) {
      if (hour >= 8 && hour < 18) {
        return 1.1;
      }
      return 0.5;
    }

    if (assetType === AssetType.BASE_LOAD) {
      const radians = ((hour - 19) / 24) * Math.PI * 2;
      return 0.7 + 0.3 * ((1 + Math.cos(radians)) / 2);
    }

    return 1;
  }

  private dispatchBattery(params: {
    netLoadKw: number;
    batterySocKwh: number;
    batteryCapacityKwh: number;
    batteryMaxPowerKw: number;
    batteryEfficiency: number;
    thresholdKw: number;
    stepHours: number;
  }): { batteryPowerKw: number; nextSocKwh: number } {
    const {
      netLoadKw,
      batterySocKwh,
      batteryCapacityKwh,
      batteryMaxPowerKw,
      batteryEfficiency,
      thresholdKw,
      stepHours,
    } = params;

    const chargeTargetKw = thresholdKw * 0.6;
    let batteryPowerKw = 0;
    let nextSocKwh = batterySocKwh;

    if (netLoadKw > thresholdKw && batterySocKwh > 0) {
      const desiredDischargeKw = Math.min(batteryMaxPowerKw, netLoadKw - thresholdKw);
      const availableKwh = batterySocKwh * batteryEfficiency;
      const maxDischargeKw = availableKwh / stepHours;
      batteryPowerKw = Math.min(desiredDischargeKw, maxDischargeKw);
      const energyOutKwh = batteryPowerKw * stepHours;
      nextSocKwh = Math.max(0, batterySocKwh - energyOutKwh / batteryEfficiency);
    } else if (netLoadKw < chargeTargetKw && batterySocKwh < batteryCapacityKwh) {
      const desiredChargeKw = Math.min(batteryMaxPowerKw, chargeTargetKw - netLoadKw);
      const availableCapacityKwh = batteryCapacityKwh - batterySocKwh;
      const maxChargeKw = availableCapacityKwh / (stepHours * batteryEfficiency);
      batteryPowerKw = -Math.min(desiredChargeKw, maxChargeKw);
      const energyInKwh = Math.abs(batteryPowerKw) * stepHours;
      nextSocKwh = Math.min(batteryCapacityKwh, batterySocKwh + energyInKwh * batteryEfficiency);
    }

    return { batteryPowerKw, nextSocKwh };
  }

  private validateInput(input: SimulationInput): void {
    if (input.clock.stepMinutes <= 0) {
      throw new BadRequestException('stepMinutes must be greater than zero');
    }
    if (Number.isNaN(Date.parse(input.clock.startDateTimeIso))) {
      throw new BadRequestException('startDateTimeIso must be a valid ISO timestamp');
    }
    if (Number.isNaN(Date.parse(input.clock.endDateTimeIso))) {
      throw new BadRequestException('endDateTimeIso must be a valid ISO timestamp');
    }

    const startMs = Date.parse(input.clock.startDateTimeIso);
    const endMs = Date.parse(input.clock.endDateTimeIso);
    const stepMs = input.clock.stepMinutes * 60 * 1000;
    const diffMs = endMs - startMs;

    if (diffMs <= 0) {
      throw new BadRequestException('endDateTimeIso must be after startDateTimeIso');
    }
    if (diffMs % stepMs !== 0) {
      throw new BadRequestException('endDateTimeIso must align with stepMinutes');
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

    const config = this.getNeighborhoodConfig();
    if (input.households.length !== config.houseCount) {
      throw new BadRequestException(
        `households must include ${config.houseCount} entries`,
      );
    }

    if (input.publicChargers.length !== config.publicChargerCount) {
      throw new BadRequestException(
        `publicChargers must include ${config.publicChargerCount} assets`,
      );
    }

    input.publicChargers.forEach((asset) => {
      if (asset.type !== AssetType.PUBLIC_EV_CHARGER) {
        throw new BadRequestException('publicChargers assets must be PUBLIC_EV_CHARGER type');
      }
    });
  }
}
