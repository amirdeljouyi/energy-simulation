import AssetTotalsTable from './AssetTotalsTable';
import AssetsPanel from './AssetsPanel';
import HouseholdTotalsTable from './HouseholdTotalsTable';
import Last24HoursChart from './Last24HoursChart';
import SimulationClockPanel from './SimulationClockPanel';
import SimulationPlaybackPanel from './SimulationPlaybackPanel';
import { AssetInput, HouseholdInput, SimulationResult } from '../types/simulation';

const formatNetLoad = (step: SimulationResult['steps'][number]) =>
  step.neighborhoodLoadKw - step.neighborhoodPvKw;

type NeighborhoodViewProps = {
  healthStatus: string;
  startDateTime: string;
  endDateTime: string;
  stepMinutes: number;
  onStartDateTimeChange: (value: string) => void;
  onEndDateTimeChange: (value: string) => void;
  onStepMinutesChange: (value: number) => void;
  onRunSimulation: () => void;
  simLoading: boolean;
  simError?: string;
  latestStep: SimulationResult['steps'][number] | null;
  totals: SimulationResult['totals'] | null;
  households: HouseholdInput[];
  publicChargers: AssetInput[];
  simData: SimulationResult | null;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onSpeedChange: (value: number) => void;
  currentStepIndex: number;
};

export default function NeighborhoodView({
  healthStatus,
  startDateTime,
  endDateTime,
  stepMinutes,
  onStartDateTimeChange,
  onEndDateTimeChange,
  onStepMinutesChange,
  onRunSimulation,
  simLoading,
  simError,
  latestStep,
  totals,
  households,
  publicChargers,
  simData,
  isPlaying,
  speedMs,
  onTogglePlay,
  onSpeedChange,
  currentStepIndex,
}: NeighborhoodViewProps) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <SimulationClockPanel
          healthStatus={healthStatus}
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          stepMinutes={stepMinutes}
          onStartDateTimeChange={onStartDateTimeChange}
          onEndDateTimeChange={onEndDateTimeChange}
          onStepMinutesChange={onStepMinutesChange}
          onRunSimulation={onRunSimulation}
          simLoading={simLoading}
          simError={simError}
          latestStep={latestStep}
          totals={totals}
        />

        <AssetsPanel households={households} publicChargers={publicChargers} />
      </section>

      {simData && (
        <>
          <SimulationPlaybackPanel
            step={simData.steps[currentStepIndex] ?? null}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onTogglePlay={onTogglePlay}
            onSpeedChange={onSpeedChange}
            currentIndex={currentStepIndex}
            totalSteps={simData.steps.length}
          />
          <Last24HoursChart
            steps={simData.steps}
            currentIndex={currentStepIndex}
            stepMinutes={simData.clock.stepMinutes}
            title="Last 24 hours (net load)"
            subtitle="Net load = neighborhood load minus PV generation."
            valueAccessor={formatNetLoad}
          />
          <HouseholdTotalsTable totals={simData.householdTotals} />
          <AssetTotalsTable totals={simData.assetTotals} />
        </>
      )}
    </>
  );
}
