import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/reviews/[id] — load a single review for editing (owner-only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      rating: true,
      body: true,
      mediaUrl: true,
      whiskey: { select: { id: true, name: true, brand: true } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(review);
}
