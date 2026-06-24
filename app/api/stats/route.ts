import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });
  }

  // Aggregate stats for this session
  const transactions = await prisma.transaction.findMany({
    where: {
      sessionId,
      session: { userId: session.user.id }
    },
    include: {
      transactionItems: true
    }
  });

  let confirmedTotal = 0;
  let pendingTotal = 0;
  let txCount = 0;
  const productCounts: Record<string, number> = {};

  for (const tx of transactions) {
    txCount++;
    if (tx.status === "CONFIRMED") {
      confirmedTotal += tx.amount;
    } else if (tx.status === "PENDING") {
      pendingTotal += tx.amount;
    }

    for (const item of tx.transactionItems) {
      if (item.name) {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      }
    }
  }

  let topProduct = null;
  let maxCount = 0;
  for (const [name, count] of Object.entries(productCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topProduct = name;
    }
  }

  return NextResponse.json({
    confirmedTotal,
    pendingTotal,
    txCount,
    topProduct
  });
}
