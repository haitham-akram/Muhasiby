"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm"
      placeholder="Search by buyer name or amount"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
