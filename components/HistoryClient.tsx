"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import FilterBar from "@/components/FilterBar";
import FilterChip from "@/components/FilterChip";
import SearchBar from "@/components/SearchBar";
import type { Session, Transaction } from "@/lib/types";

const defaultMethods = ["Bank Transfer", "Wallet", "Cash"];

export default function HistoryClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTransactions, setSessionTransactions] = useState<
    Record<string, Transaction[]>
  >({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasFilters = Boolean(search || status || method || from || to);

  useEffect(() => {
    void loadSessions();
  }, []);

  async function loadSessions() {
    setError(null);
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = await response.json();
      setSessions(data.sessions ?? []);
    } catch {
      setError("Unable to load sessions.");
    }
  }

  const fetchResults = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (method) params.set("method", method);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = await response.json();
      setResults(data.transactions ?? []);
    } catch {
      setError("Unable to load filtered results.");
    }
  }, [search, status, method, from, to]);

  useEffect(() => {
    if (!hasFilters) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchResults();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, status, method, from, to, hasFilters, fetchResults]);

  async function toggleSession(sessionId: string) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionId);
    if (sessionTransactions[sessionId]) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed");
      }
      const data = await response.json();
      setSessionTransactions((prev) => ({
        ...prev,
        [sessionId]: data.transactions ?? [],
      }));
    } catch {
      setError("Unable to load session transactions.");
    }
  }

  const methods = useMemo(() => {
    const methodSet = new Set(defaultMethods);
    results.forEach((tx) => methodSet.add(tx.paymentMethod));
    Object.values(sessionTransactions).forEach((list) =>
      list.forEach((tx) => methodSet.add(tx.paymentMethod))
    );
    return Array.from(methodSet);
  }, [results, sessionTransactions]);

  const groupedResults = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    results.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toLocaleDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(tx);
    });
    return Array.from(map.entries());
  }, [results]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold">History</h1>
        <p className="text-sm text-text-secondary">
          Search past sessions and filter transactions.
        </p>
      </div>

      <SearchBar value={search} onChange={setSearch} />
      <FilterBar
        status={status}
        method={method}
        from={from}
        to={to}
        methods={methods}
        onStatusChange={setStatus}
        onMethodChange={setMethod}
        onFromChange={setFrom}
        onToChange={setTo}
        onClear={() => {
          setSearch("");
          setStatus("");
          setMethod("");
          setFrom("");
          setTo("");
        }}
      />

      <div className="flex flex-wrap gap-2">
        {search ? (
          <FilterChip label={`Search: ${search}`} onRemove={() => setSearch("")} />
        ) : null}
        {status ? (
          <FilterChip label={`Status: ${status}`} onRemove={() => setStatus("")} />
        ) : null}
        {method ? (
          <FilterChip label={`Method: ${method}`} onRemove={() => setMethod("")} />
        ) : null}
        {from ? (
          <FilterChip label={`From: ${from}`} onRemove={() => setFrom("")} />
        ) : null}
        {to ? <FilterChip label={`To: ${to}`} onRemove={() => setTo("")} /> : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-status-cancelled bg-card px-4 py-3 text-sm text-status-cancelled">
          {error}
        </div>
      ) : null}

      {hasFilters ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-text-secondary">
            {results.length} transactions found
          </p>
          {groupedResults.length ? (
            <div className="mt-4 space-y-6">
              {groupedResults.map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-text-secondary">
                    {date}
                  </h3>
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-background text-xs uppercase text-text-secondary">
                        <tr>
                          <th className="px-4 py-3">Buyer</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((tx) => (
                          <tr key={tx.id} className="border-t border-border">
                            <td className="px-4 py-3">{tx.buyerName}</td>
                            <td className="px-4 py-3">
                              {tx.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">{tx.paymentMethod}</td>
                            <td className="px-4 py-3 text-text-secondary">
                              {tx.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">
              No matching transactions.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.length ? (
            sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              const items = sessionTransactions[session.id] ?? [];
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary">Session</p>
                      <p className="text-lg font-semibold">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary"
                      onClick={() => toggleSession(session.id)}
                    >
                      {isExpanded ? "Hide" : "View"} transactions
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-background text-xs uppercase text-text-secondary">
                          <tr>
                            <th className="px-4 py-3">Buyer</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Method</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length ? (
                            items.map((tx) => (
                              <tr key={tx.id} className="border-t border-border">
                                <td className="px-4 py-3">{tx.buyerName}</td>
                                <td className="px-4 py-3">
                                  {tx.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">{tx.paymentMethod}</td>
                                <td className="px-4 py-3 text-text-secondary">
                                  {tx.status}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-t border-border">
                              <td
                                className="px-4 py-3 text-text-secondary"
                                colSpan={4}
                              >
                                No transactions yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-text-secondary">
              No sessions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
