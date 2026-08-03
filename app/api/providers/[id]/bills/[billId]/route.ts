import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; billId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.bill.findUnique({
    where: { id: params.billId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Bill not found" }, { status: 404 });
  }

  // Verify the bill belongs to the provider
  if (existing.providerId !== params.id) {
    return NextResponse.json({ message: "Bill not found" }, { status: 404 });
  }

  await prisma.bill.delete({
    where: { id: params.billId },
  });

  return NextResponse.json({ success: true });
}