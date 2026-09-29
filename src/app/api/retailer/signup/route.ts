import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";
import { notifyMany } from "@/lib/notify";

// POST /api/retailer/signup — Become a Seller (phone OTP demo-verified)
// body: { businessName, ownerName, phone, city, categorySlugs: string[], code }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = String(body.phone || "");
    const code = String(body.code || "");

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }
    if (code !== "1234") {
      return NextResponse.json({ ok: false, error: "INVALID_OTP" }, { status: 401 });
    }
    const { businessName, ownerName, city, categorySlugs } = body;
    if (!businessName || !ownerName || !city || !Array.isArray(categorySlugs) || categorySlugs.length === 0) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    // find or create user; mark as RETAILER
    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await db.user.create({ data: { phone, name: ownerName, role: "RETAILER" } });
    } else if (user.role === "CUSTOMER") {
      user = await db.user.update({ where: { id: user.id }, data: { role: "RETAILER", name: ownerName } });
    }

    // Existing retailer? update record instead of duplicating
    const existingRetailer = await db.retailer.findUnique({ where: { phone } });
    let retailer;
    if (existingRetailer) {
      retailer = await db.retailer.update({
        where: { phone },
        data: {
          businessName, ownerName, city,
          categorySlugs: categorySlugs.join(","),
          userId: user.id,
        },
      });
    } else {
      retailer = await db.retailer.create({
        data: {
          phone, businessName, ownerName, city,
          categorySlugs: categorySlugs.join(","),
          status: "PENDING",
          userId: user.id,
        },
      });
    }

    // login session
    const token = crypto.randomUUID() + crypto.randomUUID();
    await db.session.create({ data: { token, userId: user.id } });

    // LIVE notify admins: new seller signup
    const admins = await db.user.findMany({ where: { role: "ADMIN" } });
    await notifyMany(
      admins.map((a) => a.id),
      {
        title: "🏪 New seller waiting for approval",
        body: `${businessName} (${city}) applied to sell on PartKart.`,
        type: "ADMIN",
        link: "/admin",
      }
    );

    const res = NextResponse.json({ ok: true, status: retailer.status });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
