import { useEffect, useState } from 'react';
import { NeighborhoodConfig } from '../types/simulation';
import ChartCard from './ChartCard';

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

type NeighborhoodConfigViewProps = {
  config: NeighborhoodConfig | null;
  onSave: (input: {
    seed?: number;
    houseCount?: number;
    publicChargerCount?: number;
    assetDistribution?: { type: string; share: number }[];
    battery?: {
      capacityKwh: number;
      maxPowerKw: number;
      roundTripEfficiency: number;
      thresholdKw: number;
    };
  }) => Promise<void>;
};

export default function NeighborhoodConfigView({ config, onSave }: NeighborhoodConfigViewProps) {
  const [seed, setSeed] = useState('');
  const [houseCount, setHouseCount] = useState('');
  const [publicChargerCount, setPublicChargerCount] = useState('');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState('');
  const [batteryMaxPowerKw, setBatteryMaxPowerKw] = useState('');
  const [batteryEfficiency, setBatteryEfficiency] = useState('');
  const [batteryThresholdKw, setBatteryThresholdKw] = useState('');
  const [shares, setShares] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!config) {
      return;
    }
    setSeed(String(config.seed));
    setHouseCount(String(config.houseCount));
    setPublicChargerCount(String(config.publicChargerCount));
    setBatteryCapacityKwh(String(config.battery.capacityKwh));
    setBatteryMaxPowerKw(String(config.battery.maxPowerKw));
    setBatteryEfficiency(String(config.battery.roundTripEfficiency));
    setBatteryThresholdKw(String(config.battery.thresholdKw));
    const nextShares: Record<string, string> = {};
    config.assetDistribution.forEach((asset) => {
      nextShares[asset.type] = String(asset.share);
    });
    setShares(nextShares);
  }, [config]);

  if (!config) {
    return (
      <ChartCard title="Neighbourhood configuration" subtitle="No configuration loaded">
        <p className="text-sm text-slate-600">Run the backend to load configuration.</p>
      </ChartCard>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ChartCard title="Neighbourhood configuration" subtitle="Edit seed and battery settings">
        <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            Seed
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Houses
            <input
              type="number"
              value={houseCount}
              onChange={(event) => setHouseCount(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Public chargers
            <input
              type="number"
              value={publicChargerCount}
              onChange={(event) => setPublicChargerCount(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Battery capacity (kWh)
            <input
              type="number"
              value={batteryCapacityKwh}
              onChange={(event) => setBatteryCapacityKwh(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Battery max power (kW)
            <input
              type="number"
              value={batteryMaxPowerKw}
              onChange={(event) => setBatteryMaxPowerKw(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Battery efficiency (0-1)
            <input
              type="number"
              step="0.01"
              value={batteryEfficiency}
              onChange={(event) => setBatteryEfficiency(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
          <label className="flex flex-col gap-2">
            Shave threshold (kW)
            <input
              type="number"
              value={batteryThresholdKw}
              onChange={(event) => setBatteryThresholdKw(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
            />
          </label>
        </div>
      </ChartCard>

      <ChartCard title="Asset distribution" subtitle="Edit share across houses (0-1)">
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          {config.assetDistribution.map((asset) => (
            <label key={asset.type} className="flex flex-col gap-2">
              {asset.type.replace(/_/g, ' ')} (current {formatPercent(asset.share)})
              <input
                type="number"
                step="0.01"
                value={shares[asset.type] ?? ''}
                onChange={(event) =>
                  setShares((prev) => ({ ...prev, [asset.type]: event.target.value }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm"
              />
              <span className="text-xs text-slate-500">Current count: {asset.count} homes</span>
            </label>
          ))}
        </div>
      </ChartCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={async () => {
            await onSave({
              seed: Number(seed),
              houseCount: Number(houseCount),
              publicChargerCount: Number(publicChargerCount),
              assetDistribution: config.assetDistribution.map((asset) => ({
                type: asset.type,
                share: Number(shares[asset.type] ?? asset.share),
              })),
              battery: {
                capacityKwh: Number(batteryCapacityKwh),
                maxPowerKw: Number(batteryMaxPowerKw),
                roundTripEfficiency: Number(batteryEfficiency),
                thresholdKw: Number(batteryThresholdKw),
              },
            });
          }}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500"
        >
          Save configuration
        </button>
      </div>
    </div>
  );
}
