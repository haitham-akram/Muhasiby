import { startOfDay, endOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDayBoundaries(date: Date) {
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
    const { start, end } = getDayBoundaries(targetDate);
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

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Ignore if no body provided
  }
  const clientUuid = (body as any).clientUuid;
  const passedDate = (body as any).date;

  const targetDate = passedDate ? new Date(passedDate) : new Date();
  const { start, end } = getDayBoundaries(targetDate);

  // If clientUuid is provided, try to find by it first
  if (clientUuid) {
    const byUuid = await prisma.session.findUnique({
      where: { clientUuid },
    });
    if (byUuid) return NextResponse.json({ session: byUuid });
  }

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
    if (clientUuid && !existingSession.clientUuid) {
      const updated = await prisma.session.update({
        where: { id: existingSession.id },
        data: { clientUuid },
      })
      return NextResponse.json({ session: updated });
    }
    return NextResponse.json({ session: existingSession });
  }

  const session = await prisma.session.create({
    data: {
      userId,
      date: targetDate,
      clientUuid: clientUuid || undefined,
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
