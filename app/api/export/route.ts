import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DailySummaryPDF } from "@/components/DailySummaryPDF";
import { ReceiptPDF } from "@/components/ReceiptPDF";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type"); // "summary" | "receipt"
    const transactionId = searchParams.get("transactionId"); // required for receipt
    const lang = (searchParams.get("lang") as "en" | "ar") || "en";

    if (!sessionId) {
      return NextResponse.json({ message: "sessionId is required" }, { status: 400 });
    }

    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { transactions: true }
    });

    if (!dbSession || dbSession.userId !== session.user.id) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    if (type === "summary") {
      const stream = await renderToStream(DailySummaryPDF({
        transactions: dbSession.transactions,
        session: dbSession,
        cashierName: session.user.name || "Cashier",
        lang
      }));

      return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="daily-summary-${new Date(dbSession.date).toISOString().split('T')[0]}.pdf"`
        }
      });
    }

    if (type === "receipt") {
      if (!transactionId) {
        return NextResponse.json({ message: "transactionId is required for receipts" }, { status: 400 });
      }

      const transaction = dbSession.transactions.find(t => t.id === transactionId);
      if (!transaction) {
        return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
      }

      const stream = await renderToStream(ReceiptPDF({ transaction }));
      return new NextResponse(stream as unknown as ReadableStream<Uint8Array>, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="receipt-${transactionId}.pdf"`
        }
      });
    }

    return NextResponse.json({ message: "Invalid type parameter" }, { status: 400 });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

