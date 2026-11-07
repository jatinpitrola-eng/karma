import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, makeSessionToken } from "@/lib/session";

// POST /api/auth/verify-otp { phone, code }
// Demo: OTP must be 1234 (also accepted from stored otp records). Creates user if new.
export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!/^\d{10}$/.test(String(phone || ""))) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }
    if (String(code) !== "1234") {
      return NextResponse.json({ ok: false, error: "INVALID_OTP" }, { status: 401 });
    }
    const otp = await db.otp.findFirst({
      where: { phone, code: "1234", consumed: false },
      orderBy: { createdAt: "desc" },
    });
    if (otp) await db.otp.update({ where: { id: otp.id }, data: { consumed: true } });

    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await db.user.create({ data: { phone, role: "CUSTOMER" } });
    }

    // Stateless signed token — survives serverless instance resets.
    // DB session row kept best-effort for local/audit compat.
    const token = makeSessionToken(user.id);
    try {
      await db.session.create({ data: { token, userId: user.id } });
    } catch {
      /* instance-local only — signed cookie still authenticates */
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
