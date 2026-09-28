import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/products — all products from every retailer
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ products: [] }, { status: 403 });

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      retailer: { select: { businessName: true, city: true, status: true } },
      category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
      vehicles: { include: { vehicle: { select: { brand: true, model: true } } } },
    },
  });
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      partNumber: p.partNumber,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      active: p.active,
      images: p.images,
      retailer: p.retailer,
      category: p.category,
      vehicleCount: p.vehicles.length,
    })),
  });
}
