import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, clientUuid } = await request.json();

  if (!name && !phone) {
    return NextResponse.json({ message: "Name or phone required" }, { status: 400 });
  }

  const updateData: { name?: string; phone?: string; clientUuid?: string } = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  // If clientUuid is provided, try to find by clientUuid first (idempotent upsert)
  if (clientUuid) {
    const existing = await prisma.customer.findUnique({
      where: { clientUuid },
    });
    if (existing) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: updateData,
      });
      return NextResponse.json({ customer: updated });
    }
  }

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { ...updateData, ...(clientUuid && { clientUuid }) },
  });

  return NextResponse.json({ customer });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  await prisma.customer.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
