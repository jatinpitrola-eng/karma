import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// helper — load retailer for user
async function myRetailer(userId: string) {
  return db.retailer.findUnique({ where: { userId } });
}

// GET /api/retailer/products — my products only (tenant isolation)
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") return NextResponse.json({ products: [] }, { status: 403 });
  const retailer = await myRetailer(user.id);
  if (!retailer) return NextResponse.json({ products: [] }, { status: 404 });

  const products = await db.product.findMany({
    where: { retailerId: retailer.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
      vehicles: { include: { vehicle: { select: { id: true, brand: true, model: true, type: true, key: true } } } },
    },
  });
  return NextResponse.json({
    products: products.map((p) => ({
      ...p,
      vehicles: p.vehicles.map((pv) => pv.vehicle),
    })),
  });
}

// POST /api/retailer/products — add product (approved retailers only; goes live immediately)
// body: { name, categoryId, price, mrp, stock, partNumber, description, vehicleIds: string[] }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const retailer = await myRetailer(user.id);
  if (!retailer) return NextResponse.json({ ok: false, error: "NO_RETAILER" }, { status: 404 });
  if (retailer.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "PENDING_APPROVAL" }, { status: 403 });
  }

  const body = await req.json();
  const { name, categoryId, price, mrp, stock, partNumber, description, vehicleIds } = body;
  if (!name || !categoryId || !price || !mrp || !partNumber || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }
  if (Number(price) > Number(mrp)) {
    return NextResponse.json({ ok: false, error: "PRICE_GT_MRP" }, { status: 400 });
  }

  // stable key from part number + retailer phone → upsert-safe
  const key = `r-${retailer.phone}-${String(partNumber).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const slug = `${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}-${Date.now().toString(36)}`;
  const images = JSON.stringify([
    { g: "from-yellow-50 to-amber-100", e: "🔧" },
    { g: "from-amber-50 to-yellow-100", e: "⚙️" },
    { g: "from-yellow-100 to-amber-200", e: "🔩" },
  ]);

  const product = await db.product.upsert({
    where: { key },
    create: {
      key, slug, name, categoryId,
      retailerId: retailer.id,
      price: Number(price), mrp: Number(mrp),
      stock: Number(stock ?? 10),
      partNumber, description: description ?? "",
      images,
    },
    update: {
      name, categoryId,
      price: Number(price), mrp: Number(mrp),
      stock: Number(stock ?? 10),
      partNumber, description: description ?? "",
    },
  });

  // replace vehicle links
  await db.productVehicle.deleteMany({ where: { productId: product.id } });
  await db.productVehicle.createMany({
    data: vehicleIds.map((v: string) => ({ productId: product.id, vehicleId: v })),
  });

  return NextResponse.json({ ok: true, product });
}
