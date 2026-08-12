"use client";

import { useLanguage } from '@/app/providers';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useLanguage();
  return (
    <input
      className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm"
      placeholder={t("searchPlaceholder")}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
