import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import AssetTotalsTable from './components/AssetTotalsTable';
import AssetsPanel from './components/AssetsPanel';
import HouseholdTotalsTable from './components/HouseholdTotalsTable';
import Last24HoursChart from './components/Last24HoursChart';
import SimulationClockPanel from './components/SimulationClockPanel';
import SimulationHeader from './components/SimulationHeader';
import SimulationPlaybackPanel from './components/SimulationPlaybackPanel';
import { baseHouseholds, publicChargers } from './data/simulationDefaults';
import { NeighborhoodConfig, SimulationResult } from './types/simulation';

const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;

const RUN_SIMULATION = gql`
  mutation RunSimulation($input: SimulationInput!) {
    runSimulation(input: $input) {
      clock {
        startDateTimeIso
        stepMinutes
        steps
      }
      steps {
        stepIndex
        timestampIso
        neighborhoodLoadKw
        neighborhoodPvKw
        gridImportKw
        gridExportKw
        season
        temperatureC
        irradianceFactor
      }
      householdTotals {
        householdId
        householdName
        loadKwh
        pvKwh
        netLoadKwh
        exportKwh
      }
      assetTotals {
        assetId
        type
        name
        cumulativeKwh
      }
      totals {
        neighborhoodImportKwh
        neighborhoodExportKwh
        neighborhoodConsumptionKwh
        neighborhoodPvKwh
      }
    }
  }
`;

const NEIGHBORHOOD_CONFIG = gql`
  query NeighborhoodConfig {
    neighborhoodConfig {
      seed
      houseCount
      publicChargerCount
      assetDistribution {
        type
        share
        count
      }
      households {
        id
        name
        assets {
          id
          name
          type
          ratedKw
        }
      }
      publicChargers {
        id
        name
        type
        ratedKw
      }
    }
  }
`;

type HealthQueryResult = {
  health: string;
};

type RunSimulationResult = {
  runSimulation: SimulationResult;
};

type NeighborhoodConfigResult = {
  neighborhoodConfig: NeighborhoodConfig;
};

const defaultSpeedMs = 700;

export default function App() {
  const { data: healthData, loading: healthLoading, error: healthError } =
    useQuery<HealthQueryResult>(HEALTH_QUERY);
  const { data: configData } = useQuery<NeighborhoodConfigResult>(NEIGHBORHOOD_CONFIG);
  const [runSimulation, { data: simData, loading: simLoading, error: simError }] =
    useMutation<RunSimulationResult>(RUN_SIMULATION);

  const [stepMinutes, setStepMinutes] = useState(15);
  const [steps, setSteps] = useState(96);
  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(defaultSpeedMs);

  const households = configData?.neighborhoodConfig.households ?? baseHouseholds;
  const chargers = configData?.neighborhoodConfig.publicChargers ?? publicChargers;

  const simulationInput = useMemo(() => {
    const startDateTimeIso = new Date(startDateTime).toISOString();
    return {
      clock: {
        startDateTimeIso,
        stepMinutes: Number(stepMinutes),
        steps: Number(steps),
      },
      households,
      publicChargers: chargers,
    };
  }, [startDateTime, stepMinutes, steps, households, chargers]);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [simData?.runSimulation.clock.startDateTimeIso, simData?.runSimulation.clock.steps]);

  useEffect(() => {
    if (!simData?.runSimulation.steps.length || !isPlaying) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next >= simData.runSimulation.steps.length) {
          return 0;
        }
        return next;
      });
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [simData, isPlaying, speedMs]);

  const latestStep = simData?.runSimulation.steps.at(-1) ?? null;
  const totals = simData?.runSimulation.totals ?? null;
  const healthStatus = healthLoading ? 'checking' : healthError ? 'offline' : healthData?.health ?? 'n/a';

  const playbackStep = simData?.runSimulation.steps[currentStepIndex] ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <SimulationHeader
          title="Energy Simulation Console"
          subtitle="Adjust the simulation clock, review configured assets, and run a deterministic neighborhood simulation."
        />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SimulationClockPanel
            healthStatus={healthStatus}
            startDateTime={startDateTime}
            stepMinutes={stepMinutes}
            steps={steps}
            onStartDateTimeChange={setStartDateTime}
            onStepMinutesChange={setStepMinutes}
            onStepsChange={setSteps}
            onRunSimulation={() => runSimulation({ variables: { input: simulationInput } })}
            simLoading={simLoading}
            simError={simError?.message}
            latestStep={latestStep}
            totals={totals}
          />

          <AssetsPanel households={households} publicChargers={chargers} />
        </section>

        {simData && (
          <>
            <SimulationPlaybackPanel
              step={playbackStep}
              isPlaying={isPlaying}
              speedMs={speedMs}
              onTogglePlay={() => setIsPlaying((prev) => !prev)}
              onSpeedChange={setSpeedMs}
              currentIndex={currentStepIndex}
              totalSteps={simData.runSimulation.steps.length}
            />
            <Last24HoursChart
              steps={simData.runSimulation.steps}
              currentIndex={currentStepIndex}
              stepMinutes={simData.runSimulation.clock.stepMinutes}
            />
            <HouseholdTotalsTable totals={simData.runSimulation.householdTotals} />
            <AssetTotalsTable totals={simData.runSimulation.assetTotals} />
          </>
        )}
      </div>
    </div>
  );
}
