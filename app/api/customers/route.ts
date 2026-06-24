import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    include: {
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedCustomers = customers.map(customer => {
    let totalSpent = 0;
    let pendingBalance = 0;
    let lastVisit = customer.createdAt;

    for (const tx of customer.transactions) {
      if (tx.createdAt > lastVisit) lastVisit = tx.createdAt;
      if (tx.status === "CONFIRMED") totalSpent += tx.amount;
      if (tx.status === "PENDING") pendingBalance += tx.amount;
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      totalSpent,
      pendingBalance,
      lastVisit,
    };
  });

  return NextResponse.json({ customers: formattedCustomers });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, phone } = await request.json();
  if (!name || !phone) {
    return NextResponse.json({ message: "Name and phone required" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: { name, phone }
  });

  return NextResponse.json({ customer }, { status: 201 });
}
