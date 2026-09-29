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
  // resolve category (accept id OR slug — the seller form sends the slug)
  const cat = await db.category.findFirst({ where: { OR: [{ id: categoryId }, { slug: categoryId }] } });
  if (!cat) {
    return NextResponse.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 400 });
  }
  const CAT_GALLERY: Record<string, string[]> = {
    chains: ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop", "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600"],
    sprockets: ["https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600"],
    "clutch-gearbox": ["https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600", "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=600&auto=format&fit=crop"],
    "drive-belts": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop"],
    brakes: ["https://images.unsplash.com/photo-1613214149922-f1809c99b414?q=80&w=600&auto=format&fit=crop", "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=600"],
    "engine-oils": ["https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=600&auto=format&fit=crop"],
    "filters-service": ["https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?q=80&w=600&auto=format&fit=crop"],
    electrical: ["https://images.unsplash.com/photo-1610647752706-3bb12232b3ab?q=80&w=600&auto=format&fit=crop", "https://images.pexels.com/photos/248747/pexels-photo-248747.jpeg?auto=compress&cs=tinysrgb&w=600"],
  };
  const gallery = CAT_GALLERY[cat?.slug ?? ""] ?? ["/images/part-placeholder.svg"];
  const images = JSON.stringify(gallery.map((url) => ({ url })));

  const product = await db.product.upsert({
    where: { key },
    create: {
      key, slug, name, categoryId: cat.id,
      retailerId: retailer.id,
      price: Number(price), mrp: Number(mrp),
      stock: Number(stock ?? 10),
      partNumber, description: description ?? "",
      images,
    },
    update: {
      name, categoryId: cat.id,
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
