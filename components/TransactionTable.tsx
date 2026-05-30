"use client";

import StatusBadge from "@/components/StatusBadge";
import type { Transaction, TransactionStatus } from "@/lib/types";

type TransactionTableProps = {
  transactions: Transaction[];
  onToggleStatus: (transaction: Transaction, status: TransactionStatus) => void;
  onDelete: (transaction: Transaction) => void;
};

const statusOrder: TransactionStatus[] = ["CONFIRMED", "PENDING", "CANCELLED"];

function getNextStatus(current: TransactionStatus) {
  const index = statusOrder.indexOf(current);
  return statusOrder[(index + 1) % statusOrder.length];
}

export default function TransactionTable({
  transactions,
  onToggleStatus,
  onDelete,
}: TransactionTableProps) {
  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-text-secondary">
        No transactions yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-background text-xs uppercase text-text-secondary">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={transaction.id} className="border-t border-border">
              <td className="px-4 py-3">{index + 1}</td>
              <td className="px-4 py-3 font-medium">
                {transaction.buyerName}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {transaction.items}
              </td>
              <td className="px-4 py-3">{transaction.paymentMethod}</td>
              <td className="px-4 py-3">
                {transaction.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={transaction.status}
                  onClick={() =>
                    onToggleStatus(
                      transaction,
                      getNextStatus(transaction.status)
                    )
                  }
                />
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {transaction.buyerPhone || "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  className="text-xs font-medium text-status-cancelled"
                  onClick={() => onDelete(transaction)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
