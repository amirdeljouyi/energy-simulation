import { ReactNode } from 'react';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  children: ReactNode;
};

export default function ChartCard({ title, subtitle, controls, children }: ChartCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {controls && <div className="flex flex-wrap items-center gap-3">{controls}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
