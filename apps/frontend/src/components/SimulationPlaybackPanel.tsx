import { SimulationStep } from '../types/simulation';

const formatKw = (value: number) => value.toFixed(1);

type SimulationPlaybackPanelProps = {
  step: SimulationStep | null;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onSpeedChange: (value: number) => void;
  currentIndex: number;
  totalSteps: number;
};

export default function SimulationPlaybackPanel({
  step,
  isPlaying,
  speedMs,
  onTogglePlay,
  onSpeedChange,
  currentIndex,
  totalSteps,
}: SimulationPlaybackPanelProps) {
  const netLoadKw = step ? step.neighborhoodLoadKw - step.neighborhoodPvKw : 0;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Live Simulation</h3>
          <p className="mt-1 text-sm text-slate-500">Time advances automatically during playback.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <select
            value={speedMs}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600"
          >
            <option value={1200}>Slow</option>
            <option value={700}>Normal</option>
            <option value={350}>Fast</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Simulated time</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {step?.timestampIso ?? 'n/a'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Step {Math.min(currentIndex + 1, totalSteps)} of {totalSteps}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weather + season</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{step?.season ?? 'n/a'}</p>
          <p className="mt-1 text-xs text-slate-500">
            {step ? `${step.temperatureC.toFixed(1)}°C` : 'n/a'} · Irradiance{' '}
            {step ? step.irradianceFactor.toFixed(2) : 'n/a'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Neighborhood power</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {formatKw(netLoadKw)} kW
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Load {formatKw(step?.neighborhoodLoadKw ?? 0)} kW · PV{' '}
            {formatKw(step?.neighborhoodPvKw ?? 0)} kW
          </p>
        </div>
      </div>
    </div>
  );
}
