import { useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import AssetsPanel from './AssetsPanel';
import ChartCard from './ChartCard';
import ChartSelect from './ChartSelect';
import ChartRenderer from './ChartRenderer';
import SimulationClockPanel from './SimulationClockPanel';
import SimulationPlaybackPanel from './SimulationPlaybackPanel';
import HouseholdTotalsTable from './HouseholdTotalsTable';
import AssetTotalsTable from './AssetTotalsTable';
import { AssetInput, HouseholdInput, SimulationResult } from '../types/simulation';
import { baseChartOptions } from './chartTheme';
import Last24HoursChart from './Last24HoursChart';

const stepsForLast24Hours = (steps: SimulationResult['steps'], currentIndex: number, stepMinutes: number) => {
  const stepsPerDay = Math.max(1, Math.round((24 * 60) / stepMinutes));
  const startIndex = Math.max(0, currentIndex - stepsPerDay + 1);
  return steps.slice(startIndex, currentIndex + 1);
};

const groupByDay = (steps: SimulationResult['steps'], stepMinutes: number) => {
  const stepHours = stepMinutes / 60;
  const map = new Map<string, { loadKwh: number; pvKwh: number }>();

  steps.forEach((step) => {
    const dateKey = step.timestampIso.slice(0, 10);
    const current = map.get(dateKey) ?? { loadKwh: 0, pvKwh: 0 };
    current.loadKwh += step.neighborhoodLoadKw * stepHours;
    current.pvKwh += step.neighborhoodPvKw * stepHours;
    map.set(dateKey, current);
  });

  const labels = Array.from(map.keys()).sort();
  return {
    labels,
    load: labels.map((label) => map.get(label)?.loadKwh ?? 0),
    pv: labels.map((label) => map.get(label)?.pvKwh ?? 0),
  };
};

const chartOptionsBase: ApexOptions = baseChartOptions;

type NeighborhoodViewProps = {
  healthStatus: string;
  startDateTime: string;
  endDateTime: string;
  stepMinutes: number;
  batteryCapacityKwh: number;
  batteryMaxPowerKw: number;
  batteryEfficiency: number;
  batteryThresholdKw: number;
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

const chartOptions = [
  { id: 'area', label: 'Neighbourhood usage over time' },
  { id: 'daily', label: 'Daily energy consumption vs generation' },
  { id: 'top', label: 'Top households by energy usage' },
  { id: 'share', label: 'Energy share by asset type' },
  { id: 'battery', label: 'Battery impact and state-of-charge' },
] as const;

type ChartOption = (typeof chartOptions)[number]['id'];

type TopHouseholdWindow = 'since-start' | 'last-24h';

export default function NeighborhoodView({
  healthStatus,
  startDateTime,
  endDateTime,
  stepMinutes,
  batteryCapacityKwh,
  batteryMaxPowerKw,
  batteryEfficiency,
  batteryThresholdKw,
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
  const [chartSelection, setChartSelection] = useState<ChartOption>('area');
  const [topWindow, setTopWindow] = useState<TopHouseholdWindow>('since-start');

  const last24Steps = useMemo(() => {
    if (!simData) {
      return [];
    }
    return stepsForLast24Hours(simData.steps, currentStepIndex, stepMinutes);
  }, [simData, currentStepIndex, stepMinutes]);

  const renderChart = () => {
    if (!simData) {
      return null;
    }

    if (chartSelection === 'area') {
      const series = [
        {
          name: 'Base load',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.baseLoadKw,
          })),
        },
        {
          name: 'Heat pumps',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.heatPumpKw,
          })),
        },
        {
          name: 'EV charging',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.homeEvKw + step.publicEvKw,
          })),
        },
        {
          name: 'PV generation',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: -step.neighborhoodPvKw,
          })),
        },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, stacked: true, type: 'area' },
        xaxis: { type: 'datetime' },
        yaxis: {
          labels: {
            formatter: (value) => `${value.toFixed(1)} kW`,
          },
        },
        tooltip: { y: { formatter: (value) => `${value.toFixed(2)} kW` } },
      };

      return <ChartRenderer options={options} series={series} type="area" height={320} />;
    }

    if (chartSelection === 'daily') {
      const grouped = groupByDay(simData.steps, stepMinutes);
      const series = [
        { name: 'Consumed', data: grouped.load },
        { name: 'PV generated', data: grouped.pv },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { columnWidth: '45%', horizontal: false } },
        xaxis: { categories: grouped.labels },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      return <ChartRenderer options={options} series={series} type="bar" height={320} />;
    }

    if (chartSelection === 'top') {
      const stepHours = stepMinutes / 60;
      const stepsToUse = topWindow === 'last-24h' ? last24Steps : simData.steps;
      const totalsMap = new Map<string, number>();

      stepsToUse.forEach((step) => {
        step.householdResults.forEach((household) => {
          totalsMap.set(
            household.householdName,
            (totalsMap.get(household.householdName) ?? 0) + household.loadKw * stepHours,
          );
        });
      });

      const sorted = Array.from(totalsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const labels = sorted.map(([name]) => name);
      const values = sorted.map(([, value]) => value);

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
        xaxis: { categories: labels },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      return (
        <ChartRenderer
          options={options}
          series={[{ name: 'Energy', data: values }]}
          type="bar"
          height={320}
        />
      );
    }

    if (chartSelection === 'battery') {
      const series = [
        {
          name: 'Net load (no battery)',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.netLoadKw,
          })),
        },
        {
          name: 'Net load (with battery)',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.netLoadWithBatteryKw,
          })),
        },
        {
          name: 'Battery power',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.batteryPowerKw,
          })),
        },
        {
          name: 'Battery SOC',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.batterySocKwh,
          })),
        },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'line' },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { type: 'datetime' },
        yaxis: [
          {
            title: { text: 'Power (kW)' },
            labels: { formatter: (value) => `${value.toFixed(1)} kW` },
          },
          {
            opposite: true,
            title: { text: 'SOC (kWh)' },
            labels: { formatter: (value) => `${value.toFixed(0)} kWh` },
          },
        ],
        tooltip: { y: { formatter: (value) => `${value.toFixed(2)}` } },
      };

      const mappedSeries = [
        { ...series[0], type: 'line' },
        { ...series[1], type: 'line' },
        { ...series[2], type: 'column' },
        { ...series[3], type: 'line', yAxisIndex: 1 },
      ];

      return <ChartRenderer options={options} series={mappedSeries} type="line" height={320} />;
    }

    const stepHours = stepMinutes / 60;
    const totals = simData.steps.reduce(
      (acc, step) => {
        acc.base += step.baseLoadKw * stepHours;
        acc.heat += step.heatPumpKw * stepHours;
        acc.homeEv += step.homeEvKw * stepHours;
        acc.publicEv += step.publicEvKw * stepHours;
        acc.pv += step.neighborhoodPvKw * stepHours;
        return acc;
      },
      { base: 0, heat: 0, homeEv: 0, publicEv: 0, pv: 0 },
    );

    const options: ApexOptions = {
      ...chartOptionsBase,
      chart: { ...chartOptionsBase.chart, type: 'donut' },
      labels: ['Base load', 'Heat pumps', 'Home EV', 'Public EV', 'PV generation'],
      tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
    };

    return (
      <ChartRenderer
        options={options}
        series={[totals.base, totals.heat, totals.homeEv, totals.publicEv, totals.pv]}
        type="donut"
        height={320}
      />
    );
  };

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
          stepMinutesDisabled
        />

        <AssetsPanel households={households} publicChargers={publicChargers} />
      </section>

      {simData && (
        <ChartCard
          title="Neighbourhood battery"
          subtitle="Peak shaving configuration"
        >
          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Capacity</span>
              <span className="font-semibold text-slate-900">
                {batteryCapacityKwh.toFixed(0)} kWh
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Max power</span>
              <span className="font-semibold text-slate-900">
                {batteryMaxPowerKw.toFixed(0)} kW
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Round-trip efficiency</span>
              <span className="font-semibold text-slate-900">
                {(batteryEfficiency * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span>Shave threshold</span>
              <span className="font-semibold text-slate-900">
                {batteryThresholdKw.toFixed(0)} kW
              </span>
            </div>
          </div>
        </ChartCard>
      )}

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
            valueAccessor={(step) => step.neighborhoodLoadKw - step.neighborhoodPvKw}
          />

          <ChartCard
            title="Neighbourhood charts"
            subtitle="Choose a chart to explore usage and gains."
            controls={
              <>
                <ChartSelect
                  value={chartSelection}
                  options={chartOptions.map((option) => ({
                    value: option.id,
                    label: option.label,
                  }))}
                  onChange={(value) => setChartSelection(value as ChartOption)}
                />
                {chartSelection === 'top' && (
                  <ChartSelect
                    value={topWindow}
                    options={[
                      { value: 'since-start', label: 'Since start' },
                      { value: 'last-24h', label: 'Last 24h' },
                    ]}
                    onChange={(value) => setTopWindow(value as TopHouseholdWindow)}
                  />
                )}
              </>
            }
          >
            {renderChart()}
            {chartSelection === 'battery' && totals && (
              <div className="mt-6 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>Peak without battery</span>
                  <span className="font-semibold text-slate-900">
                    {totals.peakLoadKw.toFixed(1)} kW
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>Peak with battery</span>
                  <span className="font-semibold text-slate-900">
                    {totals.peakLoadWithBatteryKw.toFixed(1)} kW
                  </span>
                </div>
              </div>
            )}
          </ChartCard>

          <HouseholdTotalsTable totals={simData.householdTotals} />
          <AssetTotalsTable totals={simData.assetTotals} />
        </>
      )}
    </>
  );
}
