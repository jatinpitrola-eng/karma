import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

// POST /api/retailer/orders/[id]/status { status: CONFIRMED | PACKED | SHIPPED }
// Retailer advances their part of the order; customer gets LIVE notification.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  const retailer = await db.retailer.findUnique({ where: { userId: user.id } });
  if (!retailer) return NextResponse.json({ ok: false, error: "NO_RETAILER" }, { status: 404 });

  const { id } = await params;
  const { status } = await req.json();
  const allowed = ["CONFIRMED", "PACKED", "SHIPPED"];
  if (!allowed.includes(status)) return NextResponse.json({ ok: false, error: "BAD_STATUS" }, { status: 400 });

  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  // tenant: retailer must own something in this order
  if (!order.items.some((i) => i.retailerId === retailer.id)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  if (order.status === "CANCELLED" || order.status === "DELIVERED") {
    return NextResponse.json({ ok: false, error: "FINAL_STATE" }, { status: 400 });
  }

  // Monotonic progression only (never backwards)
  const FLOW = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
  const currentIdx = FLOW.indexOf(order.status);
  const nextIdx = FLOW.indexOf(status);
  if (nextIdx !== currentIdx + 1) {
    return NextResponse.json({ ok: false, error: "BAD_TRANSITION", current: order.status }, { status: 400 });
  }

  const updated = await db.order.update({
    where: { id },
    data: {
      status,
      events: { create: { status, note: "" } },
    },
  });

  // LIVE notify customer
  const statusText: Record<string, string> = {
    CONFIRMED: "confirmed",
    PACKED: "packed and ready",
    SHIPPED: "shipped — arriving in 2-4 days",
  };
  await notify({
    userId: order.userId,
    title: `Order ${order.code} ${statusText[status]}`,
    body: `Your order from ${retailer.businessName} is ${statusText[status]}.`,
    type: "ORDER",
    link: `/orders/${id}`,
  });

  return NextResponse.json({ ok: true, order: updated });
}
