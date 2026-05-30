"use client";

import { useCallback, useEffect, useState } from "react";

import TransactionForm from "@/components/TransactionForm";
import TransactionTable from "@/components/TransactionTable";
import type { Session, Transaction, TransactionStatus } from "@/lib/types";

type TransactionFormValues = {
  buyerName: string;
  items: string;
  paymentMethod: string;
  amount: number;
  status: TransactionStatus;
  buyerPhone?: string;
};

export default function DashboardClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (sessionId: string) => {
    const response = await fetch(`/api/transactions?sessionId=${sessionId}`);
    if (!response.ok) {
      throw new Error("Failed to load transactions");
    }
    const data = await response.json();
    setTransactions(data.transactions ?? []);
  }, []);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions?today=true");
      if (!response.ok) {
        throw new Error("Failed to load session");
      }
      const data = await response.json();
      setSession(data.session);
      if (data.session?.id) {
        await loadTransactions(data.session.id);
      } else {
        setTransactions([]);
      }
    } catch {
      setError("Unable to load session data.");
    } finally {
      setIsLoading(false);
    }
  }, [loadTransactions]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  async function handleOpenSession() {
    setIsCreatingSession(true);
    setError(null);
    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to open session");
      }
      const data = await response.json();
      setSession(data.session);
      if (data.session?.id) {
        await loadTransactions(data.session.id);
      }
    } catch {
      setError("Unable to open a new session.");
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function handleAddTransaction(values: TransactionFormValues) {
    if (!session?.id) {
      setError("Open a session before adding transactions.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          ...values,
          buyerPhone: values.buyerPhone || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      const data = await response.json();
      setTransactions((prev) => [data.transaction, ...prev]);
    } catch {
      setError("Unable to add transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(
    transaction: Transaction,
    nextStatus: TransactionStatus
  ) {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setTransactions((prev) =>
        prev.map((item) => (item.id === transaction.id ? data.transaction : item))
      );
    } catch {
      setError("Unable to update status.");
    }
  }

  async function handleDelete(transaction: Transaction) {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }
      setTransactions((prev) =>
        prev.filter((item) => item.id !== transaction.id)
      );
    } catch {
      setError("Unable to delete transaction.");
    }
  }

  const sessionStatus = session?.closedAt ? "Closed" : "Open";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{"Today's Session"}</h1>
          <p className="text-sm text-text-secondary">
            {session
              ? `Status: ${sessionStatus}`
              : "Open a session to start recording today’s sales."}
          </p>
        </div>
        {!session ? (
          <button
            className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
            onClick={handleOpenSession}
            disabled={isCreatingSession}
          >
            {isCreatingSession ? "Opening..." : "Open Session"}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-text-secondary">Loading session...</div>
      ) : null}

      {session ? (
        <>
          <TransactionForm
            onSubmit={handleAddTransaction}
            isSubmitting={isSubmitting}
          />
          <TransactionTable
            transactions={transactions}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </>
      ) : null}
    </main>
  );
}
