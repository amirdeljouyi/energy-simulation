import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import DashboardViewToggle from './components/DashboardViewToggle';
import HouseholdView from './components/HouseholdView';
import NeighborhoodView from './components/NeighborhoodView';
import PublicChargersView from './components/PublicChargersView';
import SimulationHeader from './components/SimulationHeader';
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
        endDateTimeIso
        stepMinutes
      }
      steps {
        stepIndex
        timestampIso
        neighborhoodLoadKw
        neighborhoodPvKw
        baseLoadKw
        heatPumpKw
        homeEvKw
        publicEvKw
        gridImportKw
        gridExportKw
        season
        temperatureC
        irradianceFactor
        householdResults {
          householdId
          householdName
          baseLoadKw
          heatPumpKw
          homeEvKw
          loadKw
          pvKw
          netLoadKw
          exportKw
        }
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
  const [endDateTime, setEndDateTime] = useState(() => {
    const end = new Date();
    end.setSeconds(0, 0);
    end.setHours(end.getHours() + 24);
    return end.toISOString().slice(0, 16);
  });
  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(defaultSpeedMs);
  const [view, setView] = useState<'neighborhood' | 'household' | 'public'>('neighborhood');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);

  const households = useMemo(() => {
    const source = configData?.neighborhoodConfig.households ?? baseHouseholds;
    return source.map((household) => ({
      id: household.id,
      name: household.name,
      assets: household.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        ratedKw: asset.ratedKw,
        profileKw: asset.profileKw,
      })),
    }));
  }, [configData]);

  const chargers = useMemo(() => {
    const source = configData?.neighborhoodConfig.publicChargers ?? publicChargers;
    return source.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      ratedKw: asset.ratedKw,
      profileKw: asset.profileKw,
    }));
  }, [configData]);

  const simulationInput = useMemo(() => {
    const startDateTimeIso = new Date(startDateTime).toISOString();
    return {
      clock: {
        startDateTimeIso,
        endDateTimeIso: new Date(endDateTime).toISOString(),
        stepMinutes: Number(stepMinutes),
      },
      households,
      publicChargers: chargers,
    };
  }, [startDateTime, endDateTime, stepMinutes, households, chargers]);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [simData?.runSimulation.clock.startDateTimeIso, simData?.runSimulation.clock.endDateTimeIso]);

  useEffect(() => {
    if (!selectedHouseholdId && households.length > 0) {
      setSelectedHouseholdId(households[0].id);
    }
  }, [households, selectedHouseholdId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-amber-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <SimulationHeader
          title="Energy Simulation Console"
          subtitle="Adjust the simulation clock, review configured assets, and run a deterministic neighborhood simulation."
        />

        <DashboardViewToggle view={view} onChange={setView} />

        {view === 'neighborhood' && (
          <NeighborhoodView
            healthStatus={healthStatus}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            stepMinutes={stepMinutes}
            onStartDateTimeChange={setStartDateTime}
            onEndDateTimeChange={setEndDateTime}
            onStepMinutesChange={setStepMinutes}
            onRunSimulation={() => runSimulation({ variables: { input: simulationInput } })}
            simLoading={simLoading}
            simError={simError?.message}
            latestStep={latestStep}
            totals={totals}
            households={households}
            publicChargers={chargers}
            simData={simData?.runSimulation ?? null}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onSpeedChange={setSpeedMs}
            currentStepIndex={currentStepIndex}
          />
        )}

        {view === 'household' && (
          <HouseholdView
            households={households}
            selectedHouseholdId={selectedHouseholdId}
            onSelectHousehold={setSelectedHouseholdId}
            simData={simData?.runSimulation ?? null}
            rangeStart={startDateTime}
            rangeEnd={endDateTime}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onTogglePlay={() => setIsPlaying((prev) => !prev)}
            onSpeedChange={setSpeedMs}
          />
        )}

        {view === 'public' && (
          <PublicChargersView
            simData={simData?.runSimulation ?? null}
            currentStepIndex={currentStepIndex}
          />
        )}
      </div>
    </div>
  );
}
