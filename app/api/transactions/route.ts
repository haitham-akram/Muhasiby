import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionCreateSchema } from "@/lib/validations";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const method = searchParams.get("method");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const hasFilters = Boolean(search || status || method || from || to);

  if (sessionId && !hasFilters) {
    const transactions = await prisma.transaction.findMany({
      where: {
        sessionId,
        session: { userId },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  }

  const where: {
    session: { userId: string };
    status?: "CONFIRMED" | "PENDING" | "CANCELLED";
    paymentMethod?: string;
    createdAt?: { gte?: Date; lte?: Date };
    OR?: Array<Record<string, unknown>>;
  } = {
    session: { userId },
  };

  if (status) {
    where.status = status as "CONFIRMED" | "PENDING" | "CANCELLED";
  }

  if (method) {
    where.paymentMethod = method;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      where.createdAt.lte = new Date(to);
    }
  }

  if (search) {
    const orConditions: Array<Record<string, unknown>> = [
      {
        buyerName: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];

    const searchNumber = Number(search);
    if (!Number.isNaN(searchNumber)) {
      orConditions.push({ amount: searchNumber });
    }

    where.OR = orConditions;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ transactions });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = TransactionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, transactionItems, ...data } = parsed.data;

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      sessionId,
      ...data,
      transactionItems: transactionItems
        ? {
            create: transactionItems.map((item) => ({
              productId: item.productId || null,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          }
        : undefined,
    },
    include: {
      transactionItems: true,
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
