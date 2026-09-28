import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET /api/addresses — saved addresses
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ addresses: [] }, { status: 401 });
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

// POST /api/addresses { name, phone, pincode, line, city, state? }
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { name, phone, pincode, line, city, state } = await req.json();
  if (!name || !phone || !pincode || !line || !city) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }
  const hasAny = (await db.address.count({ where: { userId: user.id } })) > 0;
  const address = await db.address.create({
    data: {
      userId: user.id,
      name, phone, pincode, line, city,
      state: state ?? "",
      isDefault: !hasAny,
    },
  });
  return NextResponse.json({ ok: true, address });
}
