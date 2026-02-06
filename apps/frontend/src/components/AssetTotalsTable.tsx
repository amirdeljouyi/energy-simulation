import { AssetTotals } from '../types/simulation';

const formatKwh = (value: number) => value.toFixed(1);

const formatAssetType = (value: string) => value.replace(/_/g, ' ').toLowerCase();

type AssetTotalsTableProps = {
  totals: AssetTotals[];
};

export default function AssetTotalsTable({ totals }: AssetTotalsTableProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <h2 className="text-xl font-semibold text-slate-900">Asset Totals</h2>
      <p className="mt-1 text-sm text-slate-500">
        Energy totals per asset or meter since simulation start.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="pb-3">Asset</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Total (kWh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {totals.map((asset) => (
              <tr key={asset.assetId} className="text-slate-700">
                <td className="py-3 font-semibold text-slate-900">{asset.name ?? asset.assetId}</td>
                <td className="py-3 capitalize">{formatAssetType(asset.type)}</td>
                <td className="py-3">{formatKwh(asset.cumulativeKwh)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
