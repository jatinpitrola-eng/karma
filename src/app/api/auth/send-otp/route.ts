import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/send-otp  { phone }
// Demo mode: no real SMS. Always respond success; the OTP is shown on screen (1234).
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!/^\d{10}$/.test(String(phone || ""))) {
      return NextResponse.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }
    // Store an OTP record for realism (demo code fixed at 1234, valid 10 min)
    await db.otp.create({ data: { phone, code: "1234" } });
    return NextResponse.json({ ok: true, demoOtp: "1234", expiresIn: 600 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER" }, { status: 500 });
  }
}
