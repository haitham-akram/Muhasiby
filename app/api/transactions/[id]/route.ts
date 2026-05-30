import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionUpdateSchema } from "@/lib/validations";

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

  const nextStatus = parsed.data.status ?? existing.status;
  const nextPhone = parsed.data.buyerPhone ?? existing.buyerPhone;

  if (nextStatus === "PENDING" && (!nextPhone || nextPhone.length < 7)) {
    return NextResponse.json(
      { message: "Phone is required for pending payments" },
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
