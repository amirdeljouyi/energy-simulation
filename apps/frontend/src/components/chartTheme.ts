import type { ApexOptions } from 'apexcharts';

export const flowbiteChartColors = [
  '#1C64F2',
  '#16BDCA',
  '#9061F9',
  '#F05252',
  '#FACA15',
  '#31C48D',
];

export const baseChartOptions: ApexOptions = {
  chart: {
    toolbar: { show: false },
    fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
  },
  colors: flowbiteChartColors,
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  legend: { position: 'bottom' },
  tooltip: { theme: 'light' },
};
