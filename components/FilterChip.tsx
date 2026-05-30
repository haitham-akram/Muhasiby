"use client";

type FilterChipProps = {
  label: string;
  onRemove: () => void;
};

export default function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-text-secondary"
      onClick={onRemove}
    >
      {label} ✕
    </button>
  );
}
