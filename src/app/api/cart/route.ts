import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/cart — cart items with totals
async function cartPayload(userId: string) {
  const items = await db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          retailer: { select: { id: true, businessName: true, city: true } },
          category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
        },
      },
    },
  });
  const valid = items.filter((i) => i.product.active && i.product.stock > 0);
  const itemsTotal = valid.reduce((s, i) => s + i.product.price * i.qty, 0);
  const deliveryFee = valid.length === 0 ? 0 : itemsTotal >= 999 ? 0 : 49;
  return {
    cartCount: items.reduce((s, i) => s + i.qty, 0),
    items: items.map((i) => ({
      id: i.id,
      qty: i.qty,
      product: {
        id: i.product.id,
        slug: i.product.slug,
        name: i.product.name,
        price: i.product.price,
        mrp: i.product.mrp,
        stock: i.product.stock,
        images: i.product.images,
        active: i.product.active,
        category: i.product.category,
        retailer: i.product.retailer,
      },
    })),
    itemsTotal,
    deliveryFee,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ items: [], cartCount: 0, itemsTotal: 0, deliveryFee: 0 });
  return NextResponse.json(await cartPayload(user.id));
}

// POST /api/cart { productId, qty? } — add (or bump qty)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  const { productId, qty } = await req.json();
  const product = await db.product.findUnique({ where: { id: String(productId) } });
  if (!product || !product.active || product.stock <= 0) {
    return NextResponse.json({ ok: false, error: "PRODUCT_UNAVAILABLE" }, { status: 400 });
  }
  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });
  const newQty = Math.min(product.stock, (existing?.qty ?? 0) + (qty ?? 1));
  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { qty: newQty } });
  } else {
    await db.cartItem.create({ data: { userId: user.id, productId: product.id, qty: newQty } });
  }
  return NextResponse.json({ ok: true, ...(await cartPayload(user.id)) });
}

// PATCH /api/cart { productId, qty } — set exact qty (0 removes)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  const { productId, qty } = await req.json();
  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: String(productId) } },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (qty <= 0) {
    await db.cartItem.delete({ where: { id: existing.id } });
  } else {
    const product = await db.product.findUnique({ where: { id: existing.productId } });
    await db.cartItem.update({
      where: { id: existing.id },
      data: { qty: Math.min(qty, product?.stock ?? qty) },
    });
  }
  return NextResponse.json({ ok: true, ...(await cartPayload(user.id)) });
}

// DELETE /api/cart?productId=xxx
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  const productId = req.nextUrl.searchParams.get("productId");
  if (productId) {
    await db.cartItem.deleteMany({ where: { userId: user.id, productId } });
  } else {
    await db.cartItem.deleteMany({ where: { userId: user.id } });
  }
  return NextResponse.json({ ok: true, ...(await cartPayload(user.id)) });
}
