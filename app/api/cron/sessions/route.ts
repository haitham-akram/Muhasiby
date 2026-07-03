import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Check authorization - Vercel Cron sends a Bearer token
  // Or if it's hit locally, we should probably have a secret key.
  const authHeader = request.headers.get("authorization");
  
  // Note: Vercel CRON_SECRET is automatically set in Vercel. 
  // We should verify it to secure the endpoint.
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  
  // Skip if it's Friday (Day 5 in JavaScript where 0 is Sunday)
  if (now.getDay() === 5) {
    return NextResponse.json({ message: "Store closed on Fridays. Skipping." });
  }

  const { start, end } = {
    start: startOfDay(now),
    end: endOfDay(now),
  };

  const hour = now.getHours();

  // If it's Morning (e.g. before 12 PM), try to OPEN sessions
  if (hour < 12) {
    // Find all users (or maybe just the admin/main cashiers)
    const users = await prisma.user.findMany();
    
    let opened = 0;
    for (const user of users) {
      const existing = await prisma.session.findFirst({
        where: {
          userId: user.id,
          date: { gte: start, lte: end },
        },
      });

      if (!existing) {
        await prisma.session.create({
          data: {
            userId: user.id,
            date: new Date(),
          },
        });
        opened++;
      }
    }
    return NextResponse.json({ message: `Opened ${opened} sessions.` });
  } 
  // If it's Evening (e.g. after 8 PM/20:00), try to CLOSE sessions
  else if (hour >= 20) {
    const updated = await prisma.session.updateMany({
      where: {
        date: { gte: start, lte: end },
        closedAt: null,
      },
      data: {
        closedAt: new Date(),
      },
    });
    return NextResponse.json({ message: `Closed ${updated.count} sessions.` });
  }

  return NextResponse.json({ message: "No action taken for this time of day." });
}
