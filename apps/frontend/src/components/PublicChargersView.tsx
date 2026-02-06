import { useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import { AssetInput, SimulationResult } from '../types/simulation';
import { baseChartOptions } from './chartTheme';
import ChartCard from './ChartCard';
import ChartSelect from './ChartSelect';
import ChartRenderer from './ChartRenderer';

const chartOptions = [
  { id: 'area', label: 'Public charger load over time' },
  { id: 'daily', label: 'Daily public charging energy' },
  { id: 'bar', label: 'Public charger usage comparison' },
  { id: 'donut', label: 'Public charger energy share' },
] as const;

type ChartOption = (typeof chartOptions)[number]['id'];

const chartOptionsBase: ApexOptions = baseChartOptions;

const stepsForLast24Hours = (steps: SimulationResult['steps'], currentIndex: number, stepMinutes: number) => {
  const stepsPerDay = Math.max(1, Math.round((24 * 60) / stepMinutes));
  const startIndex = Math.max(0, currentIndex - stepsPerDay + 1);
  return steps.slice(startIndex, currentIndex + 1);
};

const groupByDay = (steps: SimulationResult['steps'], stepMinutes: number) => {
  const stepHours = stepMinutes / 60;
  const map = new Map<string, number>();

  steps.forEach((step) => {
    const dateKey = step.timestampIso.slice(0, 10);
    map.set(dateKey, (map.get(dateKey) ?? 0) + step.publicEvKw * stepHours);
  });

  const labels = Array.from(map.keys()).sort();
  return {
    labels,
    values: labels.map((label) => map.get(label) ?? 0),
  };
};

type PublicChargersViewProps = {
  simData: SimulationResult | null;
  currentStepIndex: number;
  publicChargers: AssetInput[];
};

export default function PublicChargersView({
  simData,
  currentStepIndex,
  publicChargers,
}: PublicChargersViewProps) {
  const [chartSelection, setChartSelection] = useState<ChartOption>('area');
  const [selectedChargerId, setSelectedChargerId] = useState<string>('all');

  const last24Steps = useMemo(() => {
    if (!simData) {
      return [];
    }
    return stepsForLast24Hours(simData.steps, currentStepIndex, simData.clock.stepMinutes);
  }, [simData, currentStepIndex]);

  const totalRatedKw = publicChargers.reduce((sum, charger) => sum + charger.ratedKw, 0);
  const selectedCharger = publicChargers.find((charger) => charger.id === selectedChargerId) ?? null;
  const selectedShare = selectedCharger ? selectedCharger.ratedKw / totalRatedKw : 1;

  const renderChart = () => {
    if (!simData) {
      return null;
    }

    if (chartSelection === 'area') {
      const series = [
        {
          name: selectedCharger ? selectedCharger.name ?? 'Public EV load' : 'Public EV load',
          data: last24Steps.map((step) => ({
            x: new Date(step.timestampIso).getTime(),
            y: step.publicEvKw * selectedShare,
          })),
        },
      ];

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'area' },
        xaxis: { type: 'datetime' },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kW` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(2)} kW` } },
      };

      return <ChartRenderer options={options} series={series} type="area" height={320} />;
    }

    if (chartSelection === 'daily') {
      const grouped = groupByDay(simData.steps, simData.clock.stepMinutes);
      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { columnWidth: '45%' } },
        xaxis: { categories: grouped.labels },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      const values = grouped.values.map((value) => value * selectedShare);
      const label = selectedCharger ? selectedCharger.name ?? 'Public EV' : 'Public EV';

      return (
        <ChartRenderer
          options={options}
          series={[{ name: label, data: values }]}
          type="bar"
          height={320}
        />
      );
    }

    const publicTotals = simData.assetTotals
      .filter((asset) => asset.type === 'PUBLIC_EV_CHARGER')
      .map((asset) => ({ name: asset.name ?? asset.assetId, value: asset.cumulativeKwh }));

    if (chartSelection === 'bar') {
      if (selectedCharger) {
        const selectedTotal = publicTotals.find((asset) => asset.name === selectedCharger.name);
        const options: ApexOptions = {
          ...chartOptionsBase,
          chart: { ...chartOptionsBase.chart, type: 'bar' },
          plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
          xaxis: { categories: [selectedCharger.name ?? selectedCharger.id] },
          yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
          tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        };

        return (
          <ChartRenderer
            options={options}
            series={[{ name: 'Energy', data: [selectedTotal?.value ?? 0] }]}
            type="bar"
            height={320}
          />
        );
      }

      const options: ApexOptions = {
        ...chartOptionsBase,
        chart: { ...chartOptionsBase.chart, type: 'bar' },
        plotOptions: { bar: { horizontal: true, barHeight: '60%' } },
        xaxis: { categories: publicTotals.map((asset) => asset.name) },
        yaxis: { labels: { formatter: (value) => `${value.toFixed(1)} kWh` } },
        tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
      };

      return (
        <ChartRenderer
          options={options}
          series={[{ name: 'Energy', data: publicTotals.map((asset) => asset.value) }]}
          type="bar"
          height={320}
        />
      );
    }

    const options: ApexOptions = {
      ...chartOptionsBase,
      chart: { ...chartOptionsBase.chart, type: 'donut' },
      labels: selectedCharger
        ? [selectedCharger.name ?? selectedCharger.id]
        : publicTotals.map((asset) => asset.name),
      tooltip: { y: { formatter: (value) => `${value.toFixed(1)} kWh` } },
    };

    const donutSeries = selectedCharger
      ? [publicTotals.find((asset) => asset.name === (selectedCharger.name ?? selectedCharger.id))?.value ?? 0]
      : publicTotals.map((asset) => asset.value);

    return (
      <ChartRenderer
        options={options}
        series={donutSeries}
        type="donut"
        height={320}
      />
    );
  };

  if (!simData) {
    return null;
  }

  return (
    <ChartCard
      title="Public charger charts"
      subtitle="Usage and utilization of shared chargers."
      controls={
        <>
          <ChartSelect
            value={selectedChargerId}
            options={[
              { value: 'all', label: 'All chargers' },
              ...publicChargers.map((charger) => ({
                value: charger.id,
                label: charger.name ?? charger.id,
              })),
            ]}
            onChange={setSelectedChargerId}
          />
          <ChartSelect
            value={chartSelection}
            options={chartOptions.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            onChange={(value) => setChartSelection(value as ChartOption)}
          />
        </>
      }
    >
      {renderChart()}
    </ChartCard>
  );
}
