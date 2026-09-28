import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories — all active categories with approved-product counts
export async function GET() {
  try {
    const cats = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { active: true, retailer: { status: "APPROVED" } } } },
        },
      },
    });
    return NextResponse.json({
      categories: cats.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameHi: c.nameHi,
        nameGu: c.nameGu,
        icon: c.icon,
        gradient: c.gradient,
        count: c._count.products,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
