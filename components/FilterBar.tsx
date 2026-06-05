"use client";

import { useLanguage } from "@/app/providers";

type FilterBarProps = {
  status: string;
  method: string;
  from: string;
  to: string;
  methods: string[];
  onStatusChange: (value: string) => void;
  onMethodChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
};

export default function FilterBar({
  status,
  method,
  from,
  to,
  methods,
  onStatusChange,
  onMethodChange,
  onFromChange,
  onToChange,
  onClear,
}: FilterBarProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-sm md:flex-row md:items-end">
      <label className="flex flex-1 flex-col gap-2">
        {t("filterBar.status")}
        <select
          className="rounded-xl border border-border px-3 py-2"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="">{t("filterBar.all")}</option>
          <option value="CONFIRMED">{t("filterBar.confirmed")}</option>
          <option value="PENDING">{t("filterBar.pending")}</option>
          <option value="CANCELLED">{t("filterBar.cancelled")}</option>
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-2">
        {t("filterBar.paymentMethod")}
        <select
          className="rounded-xl border border-border px-3 py-2"
          value={method}
          onChange={(event) => onMethodChange(event.target.value)}
        >
          <option value="">{t("filterBar.all")}</option>
          {methods.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-2">
        {t("filterBar.from")}
        <input
          type="date"
          className="rounded-xl border border-border px-3 py-2"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </label>
      <label className="flex flex-1 flex-col gap-2">
        {t("filterBar.to")}
        <input
          type="date"
          className="rounded-xl border border-border px-3 py-2"
          value={to}
          onChange={(event) => onToChange(event.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={onClear}
        className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary"
      >
        {t("filterBar.clearFilters")}
      </button>
    </div>
  );
}
