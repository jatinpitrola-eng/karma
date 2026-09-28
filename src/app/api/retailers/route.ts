import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/retailers — approved retailers for the home "Top Retailers" strip
export async function GET() {
  try {
    const retailers = await db.retailer.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    return NextResponse.json({
      retailers: retailers.map((r) => ({
        id: r.id,
        businessName: r.businessName,
        city: r.city,
        productCount: r._count.products,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ retailers: [] }, { status: 500 });
  }
}
