import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// POST /api/notifications/read { id? } — mark one or all as read
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (id) {
    await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  } else {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  }
  return NextResponse.json({ ok: true });
}
