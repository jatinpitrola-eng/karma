import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// PATCH /api/admin/products/[id] — edit / enable / disable any product
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.mrp !== undefined) data.mrp = Number(body.mrp);
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.active !== undefined) data.active = !!body.active;

  const product = await db.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product });
}
