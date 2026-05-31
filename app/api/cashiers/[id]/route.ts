import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "ADMIN";
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;
        const { id } = params;

        const dataToUpdate: any = {};
        if (name) dataToUpdate.name = name;
        if (email) dataToUpdate.email = email;
        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        const updatedCashier = await prisma.user.update({
            where: { id: id },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, createdAt: true },
        });

        return NextResponse.json({ cashier: updatedCashier });
    } catch (error) {
        console.error("Error updating cashier:", error);
        return NextResponse.json({ message: "Error updating cashier" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        // Optional: First, ensure they are a cashier, not another admin
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== "CASHIER") {
            return NextResponse.json({ message: "Invalid user to delete" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: id } });

        return NextResponse.json({ success: true, message: "Cashier deleted successfully" });
    } catch (error) {
        console.error("Error deleting cashier:", error);
        return NextResponse.json({ message: "Error deleting cashier" }, { status: 500 });
    }
}
