import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/whiskeys
// Query params: q (name/brand search), category, page (default 1), pageSize (default 20)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const where = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { brand: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category: category as never }),
  };

  const [whiskeys, total] = await Promise.all([
    prisma.whiskey.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    }),
    prisma.whiskey.count({ where }),
  ]);

  const data = whiskeys.map((w) => {
    const ratings = w.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
        : null;
    return {
      id: w.id,
      name: w.name,
      brand: w.brand,
      category: w.category,
      proof: w.proof,
      ageYears: w.ageYears,
      imageUrl: w.imageUrl,
      avgRating,
      reviewCount: ratings.length,
    };
  });

  return NextResponse.json({
    data,
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
}
