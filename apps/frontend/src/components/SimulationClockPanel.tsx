import { SimulationStep, SimulationTotals } from '../types/simulation';

const formatKwh = (value: number) => value.toFixed(1);

type SimulationClockPanelProps = {
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
  latestStep?: SimulationStep | null;
  totals?: SimulationTotals | null;
};

export default function SimulationClockPanel({
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
}: SimulationClockPanelProps) {
  const latestTimestamp = latestStep?.timestampIso ?? 'n/a';

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Simulation Clock</h2>
          <p className="mt-1 text-sm text-slate-500">
            15-minute steps balance PV/load curves with quick iteration.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-600">
          Backend: {healthStatus}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Start date/time
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(event) => onStartDateTimeChange(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          End date/time
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(event) => onEndDateTimeChange(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Step size (minutes)
          <input
            type="number"
            min={1}
            value={stepMinutes}
            onChange={(event) => onStepMinutesChange(Number(event.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onRunSimulation}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={simLoading}
      >
        {simLoading ? 'Running simulation…' : 'Run simulation'}
      </button>

      {simError && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {simError}
        </p>
      )}

      {totals && (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current time</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{latestTimestamp}</p>
            <p className="mt-1 text-xs text-slate-500">Step size: {stepMinutes} minutes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weather</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {latestStep?.season ?? 'n/a'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {latestStep ? `${latestStep.temperatureC.toFixed(1)}°C` : 'n/a'} · Irradiance{' '}
              {latestStep ? latestStep.irradianceFactor.toFixed(2) : 'n/a'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Totals</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Consumption</span>
                <span className="font-semibold text-slate-900">
                  {formatKwh(totals.neighborhoodConsumptionKwh)} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span>PV generation</span>
                <span className="font-semibold text-slate-900">
                  {formatKwh(totals.neighborhoodPvKwh)} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span>Grid import</span>
                <span className="font-semibold text-slate-900">
                  {formatKwh(totals.neighborhoodImportKwh)} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span>Grid export</span>
                <span className="font-semibold text-slate-900">
                  {formatKwh(totals.neighborhoodExportKwh)} kWh
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
