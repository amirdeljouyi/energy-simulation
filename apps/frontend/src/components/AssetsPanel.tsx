import { AssetInput, HouseholdInput } from '../types/simulation';

type AssetsPanelProps = {
  households: HouseholdInput[];
  publicChargers: AssetInput[];
};

export default function AssetsPanel({ households, publicChargers }: AssetsPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <h2 className="text-xl font-semibold text-slate-900">Configured Assets</h2>
      <p className="mt-1 text-sm text-slate-500">
        Household base load is always present. Optional assets are included below.
      </p>
      <div className="mt-5 space-y-4">
        {households.map((household) => (
          <div key={household.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{household.name}</p>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {household.assets.length} assets
              </span>
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-slate-600">
              {household.assets.map((asset) => (
                <li key={asset.id} className="flex justify-between">
                  <span>{asset.type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-slate-900">{asset.ratedKw} kW</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Public EV Chargers</p>
          <p className="mt-1 text-sm text-slate-600">
            {publicChargers.length} chargers at {publicChargers[0]?.ratedKw} kW each
          </p>
        </div>
      </div>
    </div>
  );
}
