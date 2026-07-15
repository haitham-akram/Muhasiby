import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();

  const where = search
    ? {
        name: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      provider: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { clientUuid, ...data } = parsed.data;

  if (clientUuid) {
    const existing = await prisma.product.findUnique({
      where: { clientUuid },
    });
    if (existing) return NextResponse.json({ product: existing }, { status: 200 });
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      clientUuid,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
