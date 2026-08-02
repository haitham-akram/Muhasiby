import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ProductSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { clientUuid, ...data } = parsed.data;

    // If clientUuid is provided, try to find by clientUuid first (idempotent upsert)
    if (clientUuid) {
      const existing = await prisma.product.findUnique({
        where: { clientUuid },
      });
      if (existing) {
        const updated = await prisma.product.update({
          where: { id: existing.id },
          data,
        });
        return NextResponse.json({ product: updated });
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { ...data, ...(clientUuid && { clientUuid }) },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
