"use client";

import clsx from "clsx";
import { useLanguage } from "@/app/providers";

import type { TransactionStatus } from "@/lib/types";

const statusStyles: Record<TransactionStatus, string> = {
  CONFIRMED: "bg-status-confirmed",
  PENDING: "bg-status-pending",
  CANCELLED: "bg-status-cancelled",
};

type StatusBadgeProps = {
  status: TransactionStatus;
  onClick?: () => void;
};

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white",
        statusStyles[status],
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      {t(`statusBadge.${status}`)}
    </button>
  );
}
