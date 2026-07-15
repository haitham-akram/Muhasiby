import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface InvoiceItem {
  clientUuid?: string | null;
  productId?: string | null;
  newProductName?: string | null;  // if creating a new product on the fly
  description: string;
  quantity: number;
  unitPrice: number;              // cost price (سعر الشراء)
  sellPrice?: number | null;      // optional new sell price
  updateCostPrice?: boolean;      // user confirmed price update
  updateSellPrice?: boolean;      // user confirmed sell price update
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { items, totalAmount, date, clientUuid } = await request.json() as {
      items: InvoiceItem[];
      totalAmount: number;
      date?: string;
      clientUuid?: string;
    };

    if (!items || !items.length || totalAmount === undefined) {
      return NextResponse.json({ message: "Items and totalAmount are required" }, { status: 400 });
    }

    // Resolve product IDs — create new products if needed
    const resolvedItems = await Promise.all(items.map(async (item) => {
      let productId = item.productId || null;

      // If no existing product selected but a new name was provided → create product
      if (!productId && item.newProductName) {
        const newProduct = await prisma.product.create({
          data: {
            name: item.newProductName,
            defaultPrice: item.sellPrice ?? 0,
            costPrice: item.unitPrice,
            stock: 0, // stock incremented below
            providerId: params.id,
          },
        });
        productId = newProduct.id;
      }

      return { ...item, resolvedProductId: productId };
    }));

    if (clientUuid) {
      const existing = await prisma.bill.findUnique({
        where: { clientUuid },
        include: { items: { include: { product: true } } },
      });
      if (existing) {
        return NextResponse.json({ bill: existing });
      }
    }

    // Create the bill with all items
    const bill = await prisma.bill.create({
      data: {
        providerId: params.id,
        totalAmount,
        clientUuid,
        date: date ? new Date(date) : new Date(),
        items: {
          create: resolvedItems.map((item) => ({
            clientUuid: item.clientUuid,
            productId: item.resolvedProductId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sellPrice: item.sellPrice ?? null,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // After bill is created: update stock + prices for each linked product
    for (const item of resolvedItems) {
      if (!item.resolvedProductId) continue;

      const updateData: { stock?: { increment: number }; costPrice?: number; defaultPrice?: number; providerId?: string } = {
        stock: { increment: item.quantity },
        // Always assign provider
        providerId: params.id,
      };

      // Only update cost price if user explicitly confirmed
      if (item.updateCostPrice && item.unitPrice !== undefined) {
        updateData.costPrice = item.unitPrice;
      }

      // Only update sell price if user explicitly confirmed
      if (item.updateSellPrice && item.sellPrice !== undefined && item.sellPrice !== null) {
        updateData.defaultPrice = item.sellPrice;
      }

      await prisma.product.update({
        where: { id: item.resolvedProductId },
        data: updateData,
      });
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Create bill error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.bill.findMany({
      where: { providerId: params.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Get bills error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
