import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/retailer/orders — only orders containing MY products (tenant isolation)
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "RETAILER") return NextResponse.json({ orders: [] }, { status: 403 });
  const retailer = await db.retailer.findUnique({ where: { userId: user.id } });
  if (!retailer) return NextResponse.json({ orders: [] }, { status: 404 });

  const orders = await db.order.findMany({
    where: { items: { some: { retailerId: retailer.id } } },
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
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      customer: o.user,
      address: JSON.parse(o.addressJson || "{}"),
      // only MY items shown — tenant isolation
      myItems: o.items
        .filter((i) => i.retailerId === retailer.id)
        .map((i) => ({ id: i.id, name: i.name, image: i.image, price: i.price, qty: i.qty })),
      events: o.events,
    })),
  });
}
