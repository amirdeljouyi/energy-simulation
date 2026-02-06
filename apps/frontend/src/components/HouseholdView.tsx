import HouseholdPlaybackPanel from './HouseholdPlaybackPanel';
import HouseholdTotalsTable from './HouseholdTotalsTable';
import Last24HoursChart from './Last24HoursChart';
import { HouseholdStepResult, HouseholdInput, SimulationResult } from '../types/simulation';

const formatHouseholdNetLoad = (step: SimulationResult['steps'][number], householdId: string | null) => {
  const household = step.householdResults.find((result) => result.householdId === householdId);
  return household?.netLoadKw ?? 0;
};

type HouseholdViewProps = {
  households: HouseholdInput[];
  selectedHouseholdId: string | null;
  onSelectHousehold: (value: string) => void;
  simData: SimulationResult | null;
  currentStepIndex: number;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onSpeedChange: (value: number) => void;
};

export default function HouseholdView({
  households,
  selectedHouseholdId,
  onSelectHousehold,
  simData,
  currentStepIndex,
  isPlaying,
  speedMs,
  onTogglePlay,
  onSpeedChange,
}: HouseholdViewProps) {
  if (!simData) {
    return null;
  }

  const playbackStep = simData.steps[currentStepIndex] ?? null;
  const playbackHousehold: HouseholdStepResult | null =
    playbackStep?.householdResults.find((household) => household.householdId === selectedHouseholdId) ??
    null;
  const selectedTotals =
    simData.householdTotals.find((household) => household.householdId === selectedHouseholdId) ?? null;

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Household
        </label>
        <select
          value={selectedHouseholdId ?? ''}
          onChange={(event) => onSelectHousehold(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </select>
      </div>
      <HouseholdPlaybackPanel
        step={playbackStep}
        household={playbackHousehold}
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
        title="Last 24 hours (household net load)"
        subtitle="Net load reflects the selected household consumption minus PV."
        currentLabel="Household"
        valueAccessor={(step) => formatHouseholdNetLoad(step, selectedHouseholdId)}
      />
      {selectedTotals && <HouseholdTotalsTable totals={[selectedTotals]} />}
    </>
  );
}
