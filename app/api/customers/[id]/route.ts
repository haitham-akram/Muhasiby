import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        include: { transactionItems: true }
      }
    }
  });

  if (!customer) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}
