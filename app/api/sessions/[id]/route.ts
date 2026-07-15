import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Ignore
  }

  const { closedAt, clientUuid } = body as any;

  const existingSession = await prisma.session.findUnique({
    where: { id },
  });

  if (!existingSession) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  // Conflict detection
  if (existingSession.closedAt) {
    // If we're passing the SAME closedAt timestamp or it's from the SAME clientUuid, it might just be a duplicate sync
    if (clientUuid && existingSession.clientUuid === clientUuid) {
      return NextResponse.json({ session: existingSession });
    }
    // Real conflict
    return NextResponse.json(
      { conflict: "Session already closed by another user" },
      { status: 409 }
    );
  }

  const updatedSession = await prisma.session.update({
    where: { id },
    data: {
      closedAt: closedAt ? new Date(closedAt) : new Date(),
      ...(clientUuid && !existingSession.clientUuid ? { clientUuid } : {}),
    },
  });

  return NextResponse.json({ session: updatedSession });
}
