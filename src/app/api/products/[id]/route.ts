import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products/[id] — full product detail (id or slug)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const p = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        active: true,
        retailer: { status: "APPROVED" },
      },
      include: {
        category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
        retailer: { select: { id: true, businessName: true, city: true, status: true } },
        vehicles: {
          include: { vehicle: { select: { id: true, brand: true, model: true, type: true, key: true } } },
        },
      },
    });
    if (!p) return NextResponse.json({ product: null }, { status: 404 });
    return NextResponse.json({
      product: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        partNumber: p.partNumber,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        images: p.images,
        category: p.category,
        retailer: p.retailer,
        vehicles: p.vehicles.map((pv) => pv.vehicle),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ product: null }, { status: 500 });
  }
}
