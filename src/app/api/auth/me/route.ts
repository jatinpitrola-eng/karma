import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFull } from "@/lib/session";

// GET /api/auth/me → user, retailer context, cart count
export async function GET(req: NextRequest) {
  try {
    const s = await getSessionFull(req);
    if (!s) return NextResponse.json({ user: null, retailer: null, cartCount: 0 });
    const cartCount = await db.cartItem.aggregate({
      where: { userId: s.user.id },
      _sum: { qty: true },
    });
    return NextResponse.json({
      user: s.user,
      retailer: s.retailer,
      cartCount: cartCount._sum.qty ?? 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ user: null, retailer: null, cartCount: 0 }, { status: 200 });
  }
}
