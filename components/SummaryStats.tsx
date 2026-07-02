"use client";

import { useLanguage } from "@/app/providers";

type SummaryStatsProps = {
  totalTransactions: number;
  totalConfirmed: number;
  totalPending: number;
  totalCancelled: number;
  totalProfit: number;
};

export default function SummaryStats({
  totalTransactions,
  totalConfirmed,
  totalPending,
  totalCancelled,
  totalProfit,
}: SummaryStatsProps) {
  const { t } = useLanguage();
  const currency = t('currency');

  const cards = [
    { label: t("summaryStats.totalTransactions"), value: totalTransactions.toString(), isCurrency: false, highlight: false },
    { label: t("summaryStats.totalConfirmed"),    value: totalConfirmed.toFixed(2),    isCurrency: true,  highlight: false },
    { label: t("summaryStats.totalProfit"),       value: totalProfit.toFixed(2),       isCurrency: true,  highlight: true  },
    { label: t("summaryStats.totalPending"),      value: totalPending.toFixed(2),      isCurrency: true,  highlight: false },
    { label: t("summaryStats.totalCancelled"),    value: totalCancelled.toFixed(2),    isCurrency: true,  highlight: false },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 shadow-sm ${
            card.highlight
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-border bg-card'
          }`}
        >
          <p className={`text-xs uppercase ${
            card.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-secondary'
          }`}>{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${
            card.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''
          }`}>
            {card.value}
            {card.isCurrency && (
              <span className="ms-1 text-sm font-normal opacity-70">{currency}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
