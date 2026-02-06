type SimulationHeaderProps = {
  title: string;
  subtitle: string;
};

export default function SimulationHeader({ title, subtitle }: SimulationHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
        Neighbour Dashboard
      </p>
      <h1 className="text-4xl font-semibold text-slate-900">{title}</h1>
      <p className="max-w-2xl text-base text-slate-600">{subtitle}</p>
    </header>
  );
}
