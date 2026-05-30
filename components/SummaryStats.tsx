"use client";

type SummaryStatsProps = {
  totalTransactions: number;
  totalConfirmed: number;
  totalPending: number;
  totalCancelled: number;
};

export default function SummaryStats({
  totalTransactions,
  totalConfirmed,
  totalPending,
  totalCancelled,
}: SummaryStatsProps) {
  const cards = [
    { label: "Total Transactions", value: totalTransactions.toString() },
    { label: "Total Confirmed", value: totalConfirmed.toFixed(2) },
    { label: "Total Pending", value: totalPending.toFixed(2) },
    { label: "Total Cancelled", value: totalCancelled.toFixed(2) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs uppercase text-text-secondary">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
