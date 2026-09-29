import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/orders — all orders, full detail
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ orders: [] }, { status: 403 });

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { name: true, phone: true } },
    },
  });
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      total: o.total,
      itemsTotal: o.itemsTotal,
      deliveryFee: o.deliveryFee,
      discount: o.discount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      customer: o.user,
      address: JSON.parse(o.addressJson || "{}"),
      items: o.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, retailerId: i.retailerId })),
      events: o.events,
    })),
  });
}
