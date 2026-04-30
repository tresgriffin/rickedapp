import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/whiskeys/[id]
// Returns full whiskey detail with aggregate rating and 10 most recent reviews.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const whiskey = await prisma.whiskey.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              handle: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!whiskey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ratings = whiskey.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
      : null;

  const reviewCount = await prisma.review.count({
    where: { whiskeyId: id, status: "APPROVED" },
  });

  return NextResponse.json({
    id: whiskey.id,
    name: whiskey.name,
    brand: whiskey.brand,
    category: whiskey.category,
    distillery: whiskey.distillery,
    mashBill: whiskey.mashBill,
    proof: whiskey.proof,
    ageYears: whiskey.ageYears,
    description: whiskey.description,
    imageUrl: whiskey.imageUrl,
    avgRating,
    reviewCount,
    recentReviews: whiskey.reviews,
  });
}
