import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

// GET /api/orders/[id] — order detail (owner, retailer with items, or admin)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ order: null }, { status: 401 });
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, phone: true } },
    },
  });
  if (!order) return NextResponse.json({ order: null }, { status: 404 });

  const isOwner = order.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  let isSelling = false;
  if (user.role === "RETAILER") {
    const myRetailer = await db.retailer.findUnique({ where: { userId: user.id } });
    isSelling = !!myRetailer && order.items.some((i) => i.retailerId === myRetailer.id);
  }
  if (!isOwner && !isAdmin && !isSelling) {
    return NextResponse.json({ order: null }, { status: 403 });
  }
  return NextResponse.json({ order });
}

// POST /api/orders/[id]/cancel is handled via PATCH here — cancel order (owner while PLACED/CONFIRMED, admin always)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const isOwner = order.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  if (order.status !== "PLACED" && order.status !== "CONFIRMED") {
    return NextResponse.json({ ok: false, error: "CANCEL_NOT_ALLOWED" }, { status: 400 });
  }
  if (order.status === "CANCELLED") return NextResponse.json({ ok: true });

  // restore stock
  for (const item of order.items) {
    if (item.productId) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty } },
      }).catch(() => {});
    }
  }

  const updated = await db.order.update({
    where: { id },
    data: {
      status: "CANCELLED",
      paymentStatus: order.paymentMethod === "UPI" ? "PAID" : "CANCELLED",
      events: { create: { status: "CANCELLED", note: "Order cancelled" } },
    },
  });

  // Notify customer
  await notify({
    userId: order.userId,
    title: `Order ${order.code} cancelled`,
    body: "Your order has been cancelled successfully.",
    type: "ORDER",
    link: `/orders/${id}`,
  });

  return NextResponse.json({ ok: true, order: updated });
}
