import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const providers = await prisma.provider.findMany({
      include: {
        bills: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedProviders = providers.map(p => {
      const totalBills = p.bills.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalPayments = p.payments.reduce((sum, pay) => sum + pay.amount, 0);
      return {
        id: p.id,
        name: p.name,
        phone: p.phone,
        totalDebt: totalBills - totalPayments,
        billsCount: p.bills.length,
        paymentsCount: p.payments.length
      };
    });

    return NextResponse.json({ providers: enrichedProviders });
  } catch (error) {
    console.error("Fetch providers error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, clientUuid } = await request.json();
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    if (clientUuid) {
      const existing = await prisma.provider.findUnique({
        where: { clientUuid },
      });
      if (existing) return NextResponse.json({ provider: existing }, { status: 200 });
    }

    const provider = await prisma.provider.create({
      data: { name, phone, clientUuid }
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Create provider error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
