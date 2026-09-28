import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products — catalog with filters
// ?category=slug & q= & vehicleId= & min= & max= & inStock=1 & retailerId= & sort=popular|priceLow|priceHigh|discount & deals=1 & page=1 & pageSize=20
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") ?? undefined;
    const q = sp.get("q")?.trim() ?? undefined;
    const vehicleId = sp.get("vehicleId") ?? undefined;
    const min = sp.get("min") ? Number(sp.get("min")) : undefined;
    const max = sp.get("max") ? Number(sp.get("max")) : undefined;
    const inStock = sp.get("inStock") === "1";
    const retailerId = sp.get("retailerId") ?? undefined;
    const sort = sp.get("sort") ?? "popular";
    const deals = sp.get("deals") === "1";
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const pageSize = Math.min(50, Math.max(4, Number(sp.get("pageSize") ?? 20)));

    const where: Record<string, unknown> = {
      active: true,
      retailer: { status: "APPROVED" },
    };
    if (category) where.category = { slug: category };
    if (retailerId) where.retailerId = retailerId;
    if (inStock) where.stock = { gt: 0 };
    if (min !== undefined || max !== undefined) {
      where.price = {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
      };
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { partNumber: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (vehicleId) {
      where.vehicles = { some: { vehicleId } };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "priceLow") orderBy = { price: "asc" };
    else if (sort === "priceHigh") orderBy = { price: "desc" };

    const [raw, totalCount] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: deals ? 0 : (page - 1) * pageSize,
        take: deals ? 200 : pageSize,
        include: {
          category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
          retailer: { select: { id: true, businessName: true, city: true } },
          vehicles: { include: { vehicle: { select: { id: true, brand: true, model: true, type: true, key: true } } } },
        },
      }),
      db.product.count({ where }),
    ]);

    let products = raw;
    if (deals) products = raw.filter((p) => p.mrp > p.price);
    if (sort === "discount") {
      products = [...products].sort(
        (a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp
      );
    }

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        partNumber: p.partNumber,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        images: p.images,
        active: p.active,
        category: p.category,
        retailer: p.retailer,
        vehicles: p.vehicles.map((pv) => pv.vehicle),
      })),
      total: deals ? products.length : totalCount,
      page,
      pageSize,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ products: [], total: 0 }, { status: 500 });
  }
}
