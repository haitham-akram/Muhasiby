import { startOfDay, endOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDateRange(date: Date) {
  return {
    start: startOfDay(date),
    end: endOfDay(date),
  };
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const todayParam = searchParams.get("today");

  if (dateParam || todayParam === "true") {
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const { start, end } = getDateRange(targetDate);
    const session = await prisma.session.findFirst({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ session });
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = getDateRange(new Date());
  const existingSession = await prisma.session.findFirst({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  if (existingSession) {
    return NextResponse.json({ session: existingSession });
  }

  const session = await prisma.session.create({
    data: {
      userId,
      date: new Date(),
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
