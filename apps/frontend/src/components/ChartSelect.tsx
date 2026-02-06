import { Select } from 'flowbite-react';

export type ChartSelectOption = {
  value: string;
  label: string;
};

type ChartSelectProps = {
  value: string;
  options: ChartSelectOption[];
  onChange: (value: string) => void;
};

export default function ChartSelect({ value, options, onChange }: ChartSelectProps) {
  return (
    <Select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border-0 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
      style={{border: 'none'}}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
