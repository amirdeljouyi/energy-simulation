import { useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import HouseholdPlaybackPanel from './HouseholdPlaybackPanel';
import Last24HoursChart from './Last24HoursChart';
import ChartCard from './ChartCard';
import ChartSelect from './ChartSelect';
import ChartRenderer from './ChartRenderer';
import HouseholdTotalsTable from './HouseholdTotalsTable';
import { HouseholdInput, SimulationResult } from '../types/simulation';
import { baseChartOptions } from './chartTheme';

const chartOptions = [
  { id: 'area', label: 'Household usage over time' },
  { id: 'daily', label: 'Daily household energy' },
  { id: 'bar', label: 'Household energy by asset' },
  { id: 'donut', label: 'Household energy share' },
] as const;

type ChartOption = (typeof chartOptions)[number]['id'];

const chartOptionsBase: ApexOptions = baseChartOptions;

const stepsForLast24Hours = (steps: SimulationResult['steps'], currentIndex: number, stepMinutes: number) => {
  const stepsPerDay = Math.max(1, Math.round((24 * 60) / stepMinutes));
  const startIndex = Math.max(0, currentIndex - stepsPerDay + 1);
  return steps.slice(startIndex, currentIndex + 1);
};

const groupByDay = (
  steps: SimulationResult['steps'],
  householdId: string | null,
  stepMinutes: number,
) => {
  const stepHours = stepMinutes / 60;
  const map = new Map<string, { loadKwh: number; pvKwh: number }>();

  steps.forEach((step) => {
    const household = step.householdResults.find((result) => result.householdId === householdId);
    if (!household) {
      return;
    }

    const dateKey = step.timestampIso.slice(0, 10);
    const current = map.get(dateKey) ?? { loadKwh: 0, pvKwh: 0 };
    current.loadKwh += household.loadKw * stepHours;
    current.pvKwh += household.pvKw * stepHours;
    map.set(dateKey, current);
  });

  const labels = Array.from(map.keys()).sort();
  return {
    labels,
    load: labels.map((label) => map.get(label)?.loadKwh ?? 0),
    pv: labels.map((label) => map.get(label)?.pvKwh ?? 0),
  };
};

type HouseholdViewProps = {
  households: HouseholdInput[];
  selectedHouseholdId: string | null;
  onSelectHousehold: (value: string) => void;
  simData: SimulationResult | null;
  rangeStart: string;
  rangeEnd: string;
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
  rangeStart,
  rangeEnd,
  currentStepIndex,
  isPlaying,
  speedMs,
  onTogglePlay,
  onSpeedChange,
}: HouseholdViewProps) {
  const [chartSelection, setChartSelection] = useState<ChartOption>('area');

  const playbackStep = simData?.steps[currentStepIndex] ?? null;
  const playbackHousehold = playbackStep?.householdResults.find(
    (household) => household.householdId === selectedHouseholdId,
  ) ?? null;

  const last24Steps = useMemo(() => {
    if (!simData) {
      return [];
    }
    return stepsForLast24Hours(simData.steps, currentStepIndex, simData.clock.stepMinutes);
  }, [simData, currentStepIndex]);

  const renderChart = () => {
    if (!simData || !selectedHouseholdId) {
      return null;
    }

    if (chartSelection === 'area') {
      const series = [
        {
          name: 'Base load',
          data: last24Steps.map((step) => {
            const household = step.householdResults.find(
              (result) => result.householdId === selectedHouseholdId,
            );
            return { x: new Date(step.timestampIso).getTime(), y: household?.baseLoadKw ?? 0 };
          }),
        },
        {
          name: 'Heat pump',
          data: last24Steps.map((step) => {
            const household = step.householdResults.find(
              (result) => result.householdId === selectedHouseholdId,
            );
            return { x: new Date(step.timestampIso).getTime(), y: household?.heatPumpKw ?? 0 };
          }),
        },
        {
          name: 'Home EV',
          data: last24Steps.map((step) => {
            const household = step.householdResults.find(
              (result) => result.householdId === selectedHouseholdId,
            );
            return { x: new Date(step.timestampIso).getTime(), y: household?.homeEvKw ?? 0 };
          }),
        },
        {
          name: 'PV generation',
          data: last24Steps.map((step) => {
            const household = step.householdResults.find(
              (result) => result.householdId === selectedHouseholdId,
            );
            return { x: new Date(step.timestampIso).getTime(), y: -(household?.pvKw ?? 0) };
          }),
        },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, stacked: true, type: 'area' },
        xaxis: { type: 'datetime' },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kW` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(2)} kW` } },
      };

      return <ChartRenderer options={options} series={series} type="area" height={320} />;
    }

    if (chartSelection === 'daily') {
      const grouped = groupByDay(simData.steps, selectedHouseholdId, simData.clock.stepMinutes);
      const series = [
        { name: 'Consumed', data: grouped.load },
        { name: 'PV generated', data: grouped.pv },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { columnWidth: '45%' } },
        xaxis: { categories: grouped.labels },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      return <ChartRenderer options={options} series={series} type="bar" height={320} />;
    }

    const stepHours = simData.clock.stepMinutes / 60;
    const totals = simData.steps.reduce(
      (acc, step) => {
        const household = step.householdResults.find(
          (result) => result.householdId === selectedHouseholdId,
        );
        if (!household) {
          return acc;
        }
        acc.base += household.baseLoadKw * stepHours;
        acc.heat += household.heatPumpKw * stepHours;
        acc.ev += household.homeEvKw * stepHours;
        acc.pv += household.pvKw * stepHours;
        return acc;
      },
      { base: 0, heat: 0, ev: 0, pv: 0 },
    );

    if (chartSelection === 'bar') {
      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { horizontal: false, columnWidth: '45%' } },
        xaxis: { categories: ['Base', 'Heat pump', 'Home EV', 'PV'] },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      return (
        <ChartRenderer
          options={options}
          series={[{ name: 'Energy', data: [totals.base, totals.heat, totals.ev, totals.pv] }]}
          type="bar"
          height={320}
        />
      );
    }

    const options: ApexOptions = {
      ...chartOptionsBase,
      chart: { ...chartOptionsBase.chart, type: 'donut' },
      labels: ['Base load', 'Heat pump', 'Home EV', 'PV generation'],
      tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
    };

    return (
      <ChartRenderer
        options={options}
        series={[totals.base, totals.heat, totals.ev, totals.pv]}
        type="donut"
        height={320}
      />
    );
  };

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

      {simData && (
        <>
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
            valueAccessor={(step) => {
              const household = step.householdResults.find(
                (result) => result.householdId === selectedHouseholdId,
              );
              return household?.netLoadKw ?? 0;
            }}
          />

          <ChartCard
            title="Household charts"
            subtitle={`${rangeStart} → ${rangeEnd}`}
            controls={
              <ChartSelect
                value={chartSelection}
                options={chartOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                onChange={(value) => setChartSelection(value as ChartOption)}
              />
            }
          >
            {renderChart()}
          </ChartCard>

          {playbackHousehold && (
            <HouseholdTotalsTable
              totals={simData.householdTotals.filter(
                (household) => household.householdId === playbackHousehold.householdId,
              )}
            />
          )}
        </>
      )}
    </>
  );
}
