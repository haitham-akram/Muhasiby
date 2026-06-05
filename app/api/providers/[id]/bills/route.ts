import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { items, totalAmount, date } = await request.json();

    if (!items || !items.length || totalAmount === undefined) {
      return NextResponse.json({ message: "Items and totalAmount are required" }, { status: 400 });
    }

    const bill = await prisma.bill.create({
      data: {
        providerId: params.id,
        totalAmount,
        date: date ? new Date(date) : new Date(),
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Create bill error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
