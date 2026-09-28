import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/retailers — all retailers with product counts
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ retailers: [] }, { status: 403 });

  const retailers = await db.retailer.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({
    retailers: retailers.map((r) => ({
      id: r.id,
      businessName: r.businessName,
      ownerName: r.ownerName,
      phone: r.phone,
      city: r.city,
      categorySlugs: r.categorySlugs,
      status: r.status,
      createdAt: r.createdAt,
      productCount: r._count.products,
    })),
  });
}
