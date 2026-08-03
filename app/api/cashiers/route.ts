import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "ADMIN";
}

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const cashiers = await prisma.user.findMany({
            where: { role: "CASHIER" },
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ cashiers });
    } catch {
        return NextResponse.json({ message: "Error fetching cashiers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const cashier = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "CASHIER",
            },
            select: { id: true, name: true, email: true, createdAt: true }
        });

        return NextResponse.json({ cashier }, { status: 201 });
    } catch (error) {
        console.error("Failed to create cashier:", error);
        return NextResponse.json({ message: "Error creating cashier" }, { status: 500 });
    }
}
