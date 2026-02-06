type DashboardViewToggleProps = {
  view: 'neighborhood' | 'household';
  onChange: (view: 'neighborhood' | 'household') => void;
};

export default function DashboardViewToggle({ view, onChange }: DashboardViewToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs uppercase tracking-[0.2em] text-slate-600">
      <button
        type="button"
        onClick={() => onChange('neighborhood')}
        className={`rounded-full px-4 py-2 font-semibold ${
          view === 'neighborhood' ? 'bg-slate-900 text-white' : 'text-slate-600'
        }`}
      >
        Neighbourhood
      </button>
      <button
        type="button"
        onClick={() => onChange('household')}
        className={`rounded-full px-4 py-2 font-semibold ${
          view === 'household' ? 'bg-slate-900 text-white' : 'text-slate-600'
        }`}
      >
        Household
      </button>
    </div>
  );
}
