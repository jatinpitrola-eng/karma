import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/customers — all customers with order counts
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ customers: [] }, { status: 403 });

  const customers = await db.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
    })),
  });
}
