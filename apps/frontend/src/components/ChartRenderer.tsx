import Chart from 'react-apexcharts';
import type { ApexAxisChartSeries, ApexChart, ApexNonAxisChartSeries, ApexOptions } from 'apexcharts';

export type ChartRendererProps = {
  options: ApexOptions;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  type: ApexChart['type'];
  height?: number;
};

export default function ChartRenderer({ options, series, type, height = 320 }: ChartRendererProps) {
  return <Chart options={options} series={series} type={type} height={height} />;
}
