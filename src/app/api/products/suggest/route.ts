import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/suggest?q= — live search suggestions
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ suggestions: [] });
    const products = await db.product.findMany({
      where: {
        active: true,
        retailer: { status: "APPROVED" },
        OR: [{ name: { contains: q } }, { partNumber: { contains: q } }],
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        mrp: true,
        images: true,
        category: { select: { name: true, nameHi: true, nameGu: true } },
      },
    });
    return NextResponse.json({ suggestions: products });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
