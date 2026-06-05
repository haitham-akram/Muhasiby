import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { renderToStream } from "@react-pdf/renderer";
import { ProviderLedgerPDF, SingleBillPDF } from "@/components/ProviderBillsPDF";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const type = searchParams.get("type"); // "excel" | "pdf"
    const billId = searchParams.get("billId"); // optional, if present exports single bill

    if (!providerId) {
      return NextResponse.json({ message: "providerId is required" }, { status: 400 });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        bills: { include: { items: true } },
        payments: true
      }
    });

    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    if (type === "excel") {
      const wb = XLSX.utils.book_new();

      if (billId) {
        // Single Bill Export
        const bill = provider.bills.find(b => b.id === billId);
        if (!bill) return NextResponse.json({ message: "Bill not found" }, { status: 404 });

        const items = bill.items.map(item => ({
          "Description": item.description,
          "Quantity": item.quantity,
          "Unit Price": item.unitPrice,
          "Total": item.total
        }));
        const ws = XLSX.utils.json_to_sheet(items);
        XLSX.utils.book_append_sheet(wb, ws, "Bill Items");

      } else {
        // Overall Provider Statement
        const billsData = provider.bills.map(b => ({
          "Date": new Date(b.date).toLocaleDateString(),
          "Type": "Bill",
          "Amount": b.totalAmount,
          "Status": b.status
        }));
        
        const paymentsData = provider.payments.map(p => ({
          "Date": new Date(p.date).toLocaleDateString(),
          "Type": "Payment",
          "Amount": -p.amount,
          "Status": "COMPLETED"
        }));

        const ledger = [...billsData, ...paymentsData].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        
        const ws = XLSX.utils.json_to_sheet(ledger);
        XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      }

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="provider-${providerId}.xlsx"`
        }
      });
    }

    if (type === "pdf") {
      const lang = (searchParams.get("lang") as "en" | "ar") || "en";
      
      if (billId) {
        const bill = provider.bills.find(b => b.id === billId);
        if (!bill) return NextResponse.json({ message: "Bill not found" }, { status: 404 });
        
        // @ts-ignore
        const stream = await renderToStream(SingleBillPDF({ bill, provider, lang }));
        return new NextResponse(stream as any, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="bill-${billId}.pdf"`
          }
        });
      } else {
        // @ts-ignore
        const stream = await renderToStream(ProviderLedgerPDF({ provider, bills: provider.bills, payments: provider.payments, lang }));
        return new NextResponse(stream as any, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="provider-${providerId}-ledger.pdf"`
          }
        });
      }
    }

    return NextResponse.json({ message: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
