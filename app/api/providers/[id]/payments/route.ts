import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, date } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Valid amount is required" }, { status: 400 });
    }

    const payment = await prisma.providerPayment.create({
      data: {
        providerId: params.id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date()
      }
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
