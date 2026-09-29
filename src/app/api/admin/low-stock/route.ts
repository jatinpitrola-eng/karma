import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/low-stock — active products with fewer than 5 units
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ products: [] }, { status: 403 });

  const products = await db.product.findMany({
    where: { stock: { lt: 5 }, active: true },
    orderBy: { stock: "asc" },
    include: { retailer: { select: { businessName: true, city: true } } },
  });
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      stock: p.stock,
      price: p.price,
      retailer: p.retailer,
    })),
  });
}
