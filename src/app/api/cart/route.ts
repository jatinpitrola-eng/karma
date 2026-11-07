import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { CartLine, parseCart, setCartCookie, clearCartCookie } from "@/lib/cart-cookie";

// GET/POST/PATCH/DELETE /api/cart — cart items with totals.
// Storage: signed cart cookie (serverless-safe, see src/lib/cart-cookie.ts).
// Legacy DB CartItem rows (seeded demos) are migrated into the cookie on
// first GET. Response shapes are identical to the original DB-backed API.

const PRODUCT_INCLUDE = {
  retailer: { select: { id: true, businessName: true, city: true } },
  category: { select: { slug: true, name: true, nameHi: true, nameGu: true } },
};

type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  images: string;
  active: boolean;
  category: { slug: string; name: string; nameHi: string; nameGu: string } | null;
  retailer: { id: string; businessName: string; city: string } | null;
};

async function cartPayload(lines: CartLine[]) {
  const ids = lines.map((l) => l.productId);
  const products = ids.length
    ? await db.product.findMany({ where: { id: { in: ids } }, include: PRODUCT_INCLUDE })
    : [];
  const byId = new Map<string, CartProduct>(products.map((p) => [p.id, p as CartProduct]));

  const items = lines
    .map((l) => ({ line: l, product: byId.get(l.productId) }))
    .filter((x): x is { line: CartLine; product: CartProduct } => Boolean(x.product))
    .map(({ line, product }) => ({ line, product, valid: product.active && product.stock > 0 }));

  const validItems = items.filter((i) => i.valid);
  const itemsTotal = validItems.reduce((s, i) => s + i.product.price * i.line.qty, 0);
  const deliveryFee = validItems.length === 0 ? 0 : itemsTotal >= 999 ? 0 : 49;

  return {
    cartCount: validItems.reduce((s, i) => s + i.line.qty, 0),
    items: items.map(({ line, product }) => ({
      id: line.productId, // line id === productId (UI keys + product-scoped ops)
      qty: line.qty,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        stock: product.stock,
        images: product.images,
        active: product.active,
        category: product.category,
        retailer: product.retailer,
      },
    })),
    itemsTotal,
    deliveryFee,
  };
}

async function migrateLegacyDbCart(userId: string): Promise<CartLine[]> {
  const rows = await db.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { productId: true, qty: true },
  });
  return rows.map((r) => ({ productId: r.productId, qty: r.qty }));
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ items: [], cartCount: 0, itemsTotal: 0, deliveryFee: 0 });

  let lines = parseCart(req);
  let migrated = false;
  if (lines.length === 0) {
    lines = await migrateLegacyDbCart(user.id);
    migrated = lines.length > 0;
  }
  const payload = await cartPayload(lines);
  const res = NextResponse.json(payload);
  if (migrated) setCartCookie(res, lines);
  return res;
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
  const lines = parseCart(req);
  const existing = lines.find((l) => l.productId === product.id);
  const newQty = Math.min(product.stock, (existing?.qty ?? 0) + (Number(qty) || 1));
  if (existing) {
    existing.qty = newQty;
  } else {
    lines.unshift({ productId: product.id, qty: newQty });
  }
  const payload = await cartPayload(lines);
  const res = NextResponse.json({ ok: true, ...payload });
  setCartCookie(res, lines);
  return res;
}

// PATCH /api/cart { productId, qty } — set exact qty (0 removes)
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  const { productId, qty } = await req.json();
  const lines = parseCart(req);
  const existing = lines.find((l) => l.productId === String(productId));
  if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  if (Number(qty) <= 0) {
    const next = lines.filter((l) => l.productId !== existing.productId);
    const payload = await cartPayload(next);
    const res = NextResponse.json({ ok: true, ...payload });
    setCartCookie(res, next);
    return res;
  }
  const product = await db.product.findUnique({ where: { id: existing.productId } });
  existing.qty = Math.min(Number(qty), product?.stock ?? Number(qty));
  const payload = await cartPayload(lines);
  const res = NextResponse.json({ ok: true, ...payload });
  setCartCookie(res, lines);
  return res;
}

// DELETE /api/cart?productId=xxx (omit to clear the cart)
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "NOT_LOGGED_IN" }, { status: 401 });
  const productId = req.nextUrl.searchParams.get("productId");
  const lines = parseCart(req);
  const next = productId ? lines.filter((l) => l.productId !== productId) : [];
  const payload = await cartPayload(next);
  const res = NextResponse.json({ ok: true, ...payload });
  if (next.length === 0) clearCartCookie(res);
  else setCartCookie(res, next);
  return res;
}
