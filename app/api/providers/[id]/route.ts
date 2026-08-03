import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: params.id },
      include: {
        bills: {
          include: { items: true },
          orderBy: { date: 'desc' }
        },
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    const totalBills = provider.bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPayments = provider.payments.reduce((sum, pay) => sum + pay.amount, 0);

    return NextResponse.json({
      provider: {
        ...provider,
        totalDebt: totalBills - totalPayments
      }
    });
  } catch (error) {
    console.error("Fetch provider error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, clientUuid } = await request.json();

    const updateData: { name?: string; phone?: string; clientUuid?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    // If clientUuid is provided, try to find by clientUuid first (idempotent upsert)
    if (clientUuid) {
      const existing = await prisma.provider.findUnique({
        where: { clientUuid },
      });
      if (existing) {
        const updated = await prisma.provider.update({
          where: { id: existing.id },
          data: updateData,
        });
        return NextResponse.json({ provider: updated });
      }
    }

    const provider = await prisma.provider.update({
      where: { id: params.id },
      data: { ...updateData, ...(clientUuid && { clientUuid }) },
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Update provider error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.provider.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ message: "Provider not found" }, { status: 404 });
  }

  await prisma.provider.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
