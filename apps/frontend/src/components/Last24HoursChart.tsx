import { SimulationStep } from '../types/simulation';

const formatKw = (value: number) => value.toFixed(1);

type Last24HoursChartProps = {
  steps: SimulationStep[];
  currentIndex: number;
  stepMinutes: number;
  title: string;
  subtitle: string;
  valueAccessor: (step: SimulationStep) => number;
  currentLabel?: string;
};

export default function Last24HoursChart({
  steps,
  currentIndex,
  stepMinutes,
  title,
  subtitle,
  valueAccessor,
  currentLabel,
}: Last24HoursChartProps) {
  const stepsPerDay = Math.max(1, Math.round((24 * 60) / stepMinutes));
  const startIndex = Math.max(0, currentIndex - stepsPerDay + 1);
  const windowSteps = steps.slice(startIndex, currentIndex + 1);

  const values = windowSteps.map((step) => valueAccessor(step));
  const maxValue = Math.max(0.1, ...values.map((value) => Math.abs(value)));

  const width = 640;
  const height = 180;
  const padding = 24;

  const points = windowSteps
    .map((step, index) => {
      const x =
        padding + (index / Math.max(1, windowSteps.length - 1)) * (width - padding * 2);
      const normalized = valueAccessor(step) / maxValue;
      const y = height / 2 - normalized * ((height - padding * 2) / 2);
      return `${x},${y}`;
    })
    .join(' ');

  const latestValue = values.at(-1) ?? 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600">
          {currentLabel ?? 'Current'}: {formatKw(latestValue)} kW
        </div>
      </div>
      <div className="mt-6 overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[32rem]"
        >
          <rect x={0} y={0} width={width} height={height} rx={20} fill="#f8fafc" />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <polyline
            fill="none"
            stroke="#1C64F2"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />
        </svg>
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        Window: {windowSteps.length} steps · {stepMinutes} min/step
      </p>
    </div>
  );
}
