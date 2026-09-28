import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

// POST /api/admin/orders/[id]/status { status } — force any status change
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await params;
  const { status } = await req.json();
  const ALL = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!ALL.includes(status)) return NextResponse.json({ ok: false, error: "BAD_STATUS" }, { status: 400 });

  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    for (const item of order.items) {
      if (item.productId) {
        await db.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } }).catch(() => {});
      }
    }
  }

  const updated = await db.order.update({
    where: { id },
    data: {
      status,
      ...(status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
      ...(status === "CANCELLED" && order.paymentMethod === "COD" ? { paymentStatus: "CANCELLED" } : {}),
      events: { create: { status, note: "Updated by admin" } },
    },
  });

  await notify({
    userId: order.userId,
    title: `Order ${order.code}: status updated`,
    body: `Your order status is now ${status.toLowerCase()}.`,
    type: "ORDER",
    link: `/orders/${id}`,
  });

  return NextResponse.json({ ok: true, order: updated });
}
