import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CategorySchema = z.object({
  name: z.string().min(2),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CategorySchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  // Check for uniqueness
  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });

  if (existing) {
    return NextResponse.json({ message: "Category already exists" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: parsed.data,
  });

  return NextResponse.json({ category }, { status: 201 });
}
