import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/admin/stats — platform totals
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ ok: false }, { status: 403 });

  const [orders, revenueAgg, retailersApproved, retailersPending, products, customers, lowStock] = await Promise.all([
    db.order.count({ where: { status: { not: "CANCELLED" } } }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.retailer.count({ where: { status: "APPROVED" } }),
    db.retailer.count({ where: { status: "PENDING" } }),
    db.product.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { stock: { lt: 5 }, active: true } }),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      orders,
      revenue: revenueAgg._sum.total ?? 0,
      retailersApproved,
      retailersPending,
      products,
      customers,
      lowStock,
    },
  });
}
