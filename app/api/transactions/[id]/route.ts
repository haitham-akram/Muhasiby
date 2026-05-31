import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionSchema, TransactionUpdateSchema } from "@/lib/validations";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = TransactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      session: { userId },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }

  const merged = {
    buyerName: parsed.data.buyerName ?? existing.buyerName,
    items: parsed.data.items ?? existing.items,
    paymentMethod: parsed.data.paymentMethod ?? existing.paymentMethod,
    amount: parsed.data.amount ?? existing.amount,
    status: parsed.data.status ?? existing.status,
    buyerPhone: parsed.data.buyerPhone ?? existing.buyerPhone ?? undefined,
  };

  const mergedValidation = TransactionSchema.safeParse(merged);
  if (!mergedValidation.success) {
    return NextResponse.json(
      { errors: mergedValidation.error.flatten() },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ transaction });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.transaction.findFirst({
    where: {
      id: params.id,
      session: { userId },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }

  await prisma.transaction.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
