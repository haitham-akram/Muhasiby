import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { startOfMonth, endOfMonth } from "date-fns";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));

  const transactions = await prisma.transaction.findMany({
    where: {
      session: { userId: session.user.id },
      createdAt: { gte: start, lte: end },
    },
    include: {
      transactionItems: true,
      paymentSplits: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate stats
  let totalConfirmed = 0;
  let totalPending = 0;
  let totalCancelled = 0;
  let totalProfit = 0;

  // Group by day
  const byDay: Record<string, { confirmed: number; pending: number; cancelled: number; profit: number; count: number }> = {};

  for (const tx of transactions) {
    const day = tx.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!byDay[day]) byDay[day] = { confirmed: 0, pending: 0, cancelled: 0, profit: 0, count: 0 };

    byDay[day].count++;

    if (tx.status === "CONFIRMED") {
      totalConfirmed += tx.amount;
      byDay[day].confirmed += tx.amount;

      const cost = tx.transactionItems.reduce((acc, item) => acc + (item.unitCost ?? 0) * item.quantity, 0);
      const profit = tx.amount - cost;
      totalProfit += profit;
      byDay[day].profit += profit;
    } else if (tx.status === "PENDING") {
      totalPending += tx.amount;
      byDay[day].pending += tx.amount;
    } else {
      totalCancelled += tx.amount;
      byDay[day].cancelled += tx.amount;
    }
  }

  // Payment method breakdown
  const byMethod: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.status === "CANCELLED") continue;
    for (const split of tx.paymentSplits) {
      byMethod[split.method] = (byMethod[split.method] ?? 0) + split.amount;
    }
  }

  return NextResponse.json({
    year,
    month,
    totalTransactions: transactions.length,
    totalConfirmed,
    totalPending,
    totalCancelled,
    totalProfit,
    byDay,
    byMethod,
  });
}
