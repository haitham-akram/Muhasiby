"use client";

import { useEffect, useMemo, useState } from "react";

import SummaryStats from "@/components/SummaryStats";
import { useLanguage } from "@/app/providers";
import type { Session, Transaction } from "@/lib/types";

export default function SummaryClient() {
  const { t } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadSession();
  }, []);

  async function loadSession() {
    setError(null);
    try {
      const response = await fetch("/api/sessions?today=true");
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = await response.json();
      setSession(data.session);
      if (data.session?.id) {
        const transactionsResponse = await fetch(
          `/api/transactions?sessionId=${data.session.id}`
        );
        if (transactionsResponse.ok) {
          const txData = await transactionsResponse.json();
          setTransactions(txData.transactions ?? []);
        }
      }
    } catch {
      setError("Unable to load summary data.");
    }
  }

  async function handleMarkConfirmed(id: string) {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = await response.json();
      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? data.transaction : item))
      );
    } catch {
      setError("Unable to update transaction.");
    }
  }

  const stats = useMemo(() => {
    const totals = {
      totalTransactions: transactions.length,
      totalConfirmed: 0,
      totalPending: 0,
      totalCancelled: 0,
    };
    transactions.forEach((tx) => {
      if (tx.status === "CONFIRMED") {
        totals.totalConfirmed += tx.amount;
      } else if (tx.status === "PENDING") {
        totals.totalPending += tx.amount;
      } else {
        totals.totalCancelled += tx.amount;
      }
    });
    return totals;
  }, [transactions]);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      map.set(tx.paymentMethod, (map.get(tx.paymentMethod) ?? 0) + tx.amount);
    });
    return Array.from(map.entries());
  }, [transactions]);

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === "PENDING"
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">{t("summaryClient.title")}</h1>
        <p className="text-sm text-text-secondary">
          {session ? t("summaryClient.reviewTotals") : t("summaryClient.noSession")}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      <SummaryStats {...stats} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("summaryClient.breakdown")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {breakdown.length ? (
            breakdown.map(([method, amount]) => (
              <div
                key={method}
                className="rounded-xl border border-border bg-background px-4 py-3 text-sm"
              >
                <p className="text-text-secondary">{method}</p>
                <p className="text-lg font-semibold">{amount.toFixed(2)} JD</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-text-secondary">{t("summaryClient.noPayments")}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("summaryClient.pendingFollowUp")}</h2>
        {pendingTransactions.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">{t("transactionTable.buyerName")}</th>
                  <th className="px-4 py-3">{t("transactionForm.phoneNumber")}</th>
                  <th className="px-4 py-3">{t("transactionTable.amount")}</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-4 py-3">{tx.buyerName}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {tx.buyerPhone || "—"}
                    </td>
                    <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs font-medium text-status-confirmed"
                        onClick={() => handleMarkConfirmed(tx.id)}
                      >
                        Mark confirmed
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            {t("summaryClient.noPending")}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">{t("summaryClient.recentTransactions")}</h2>
        {transactions.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-xs uppercase text-text-secondary">
                <tr>
                  <th className="px-4 py-3">{t("transactionTable.buyerName")}</th>
                  <th className="px-4 py-3">{t("transactionTable.paymentMethod")}</th>
                  <th className="px-4 py-3">{t("transactionTable.amount")}</th>
                  <th className="px-4 py-3">{t("transactionTable.status")}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-4 py-3">{tx.buyerName}</td>
                    <td className="px-4 py-3">{tx.paymentMethod}</td>
                    <td className="px-4 py-3">{tx.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {tx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-secondary">
            {t("summaryClient.noTransactions")}
          </p>
        )}
      </div>
    </div>
  );
}
