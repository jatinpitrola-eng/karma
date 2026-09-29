import { NextRequest, NextResponse } from "next/server";

// POST /api/coupon { code, itemsTotal }
// Demo coupon: DEMO10 = 10% off
export async function POST(req: NextRequest) {
  const { code, itemsTotal } = await req.json();
  const c = String(code || "").trim().toUpperCase();
  if (c === "DEMO10") {
    const discount = Math.round(Number(itemsTotal || 0) * 0.1);
    return NextResponse.json({ ok: true, code: "DEMO10", percent: 10, discount });
  }
  return NextResponse.json({ ok: false, error: "INVALID_COUPON" }, { status: 400 });
}
