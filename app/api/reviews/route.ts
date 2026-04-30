import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/reviews
// Query params: whiskeyId, userId, page (default 1), pageSize (default 20).
// At least one of whiskeyId or userId is required.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const whiskeyId = searchParams.get("whiskeyId") ?? "";
  const userId = searchParams.get("userId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  if (!whiskeyId && !userId) {
    return NextResponse.json(
      { error: "Provide whiskeyId or userId as a query parameter." },
      { status: 400 }
    );
  }

  const where = {
    status: "APPROVED" as const,
    ...(whiskeyId && { whiskeyId }),
    ...(userId && { userId }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        whiskey: {
          select: { id: true, name: true, brand: true, imageUrl: true },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({
    data: reviews,
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
}
