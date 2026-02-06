import { HouseholdTotals } from '../types/simulation';

const formatKwh = (value: number) => value.toFixed(1);

type HouseholdTotalsTableProps = {
  totals: HouseholdTotals[];
};

export default function HouseholdTotalsTable({ totals }: HouseholdTotalsTableProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <h2 className="text-xl font-semibold text-slate-900">Household Totals</h2>
      <p className="mt-1 text-sm text-slate-500">
        Energy totals per household since simulation start.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="pb-3">Household</th>
              <th className="pb-3">Load (kWh)</th>
              <th className="pb-3">PV (kWh)</th>
              <th className="pb-3">Net load (kWh)</th>
              <th className="pb-3">Export (kWh)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {totals.map((household) => (
              <tr key={household.householdId} className="text-slate-700">
                <td className="py-3 font-semibold text-slate-900">
                  {household.householdName}
                </td>
                <td className="py-3">{formatKwh(household.loadKwh)}</td>
                <td className="py-3">{formatKwh(household.pvKwh)}</td>
                <td className="py-3">{formatKwh(household.netLoadKwh)}</td>
                <td className="py-3">{formatKwh(household.exportKwh)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
