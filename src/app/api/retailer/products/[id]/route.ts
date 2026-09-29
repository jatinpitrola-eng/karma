import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// PATCH /api/retailer/products/[id] — edit own product (price/mrp/stock/desc/active)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const retailer = await db.retailer.findUnique({ where: { userId: user.id } });
  if (!retailer) return NextResponse.json({ ok: false, error: "NO_RETAILER" }, { status: 404 });
  if (retailer.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "PENDING_APPROVAL" }, { status: 403 });
  }

  const { id } = await params;
  // tenant check: product must belong to this retailer
  const product = await db.product.findFirst({ where: { id, retailerId: retailer.id } });
  if (!product) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.mrp !== undefined) data.mrp = Number(body.mrp);
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.description !== undefined) data.description = body.description;
  if (body.active !== undefined) data.active = !!body.active;

  const updated = await db.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product: updated });
}
