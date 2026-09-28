import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/retailer/stats — approved retailer dashboard stats (tenant-isolated)
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }
  const retailer = await db.retailer.findUnique({ where: { userId: user.id } });
  if (!retailer) return NextResponse.json({ ok: false, error: "NO_RETAILER" }, { status: 404 });

  const [totalProducts, orderItems, pendingItems] = await Promise.all([
    db.product.count({ where: { retailerId: retailer.id } }),
    db.orderItem.findMany({
      where: { retailerId: retailer.id, order: { status: { not: "CANCELLED" } } },
      select: { price: true, qty: true, orderId: true },
    }),
    db.orderItem.findMany({
      where: { retailerId: retailer.id, order: { status: { in: ["PLACED"] } } },
      select: { orderId: true },
    }),
  ]);

  const revenue = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalOrders = new Set(orderItems.map((i) => i.orderId)).size;
  const pendingOrders = new Set(pendingItems.map((i) => i.orderId)).size;

  return NextResponse.json({
    ok: true,
    stats: { totalProducts, totalOrders, revenue, pendingOrders },
    retailer: {
      id: retailer.id,
      businessName: retailer.businessName,
      status: retailer.status,
      city: retailer.city,
    },
  });
}
