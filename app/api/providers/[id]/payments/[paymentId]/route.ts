import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.providerPayment.findUnique({
    where: { id: params.paymentId },
  });

  if (!existing) {
    return NextResponse.json({ message: "Payment not found" }, { status: 404 });
  }

  // Verify the payment belongs to the provider
  if (existing.providerId !== params.id) {
    return NextResponse.json({ message: "Payment not found" }, { status: 404 });
  }

  await prisma.providerPayment.delete({
    where: { id: params.paymentId },
  });

  return NextResponse.json({ success: true });
}