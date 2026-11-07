import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { notify } from "@/lib/notify";

// POST /api/admin/retailers/[id]/status { status: APPROVED | BLOCKED | PENDING }
// Approving instantly unlocks the seller portal + LIVE notification to the retailer.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ ok: false }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();
  if (!["APPROVED", "BLOCKED", "PENDING"].includes(status)) {
    return NextResponse.json({ ok: false, error: "BAD_STATUS" }, { status: 400 });
  }

  const retailer = await db.retailer.findUnique({ where: { id }, include: { user: true } });
  if (!retailer) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  const updated = await db.retailer.update({ where: { id }, data: { status } });

  // ensure user has RETAILER role so they can access the portal
  if (retailer.user && retailer.user.role !== "ADMIN") {
    await db.user.update({ where: { id: retailer.user.id }, data: { role: "RETAILER" } });
  }

  if (status === "APPROVED") {
    const notifyUserId = retailer.user?.id ?? (await db.user.findUnique({ where: { phone: retailer.phone } }))?.id;
    if (notifyUserId) {
      await notify({
        userId: notifyUserId,
        title: "✅ Your account is approved!",
        body: `${retailer.businessName} is now live on KARMA. Start adding products in your Seller Hub.`,
        type: "RETAILER",
        link: "/seller",
      });
    }
  } else if (status === "BLOCKED") {
    const notifyUserId = retailer.user?.id ?? (await db.user.findUnique({ where: { phone: retailer.phone } }))?.id;
    if (notifyUserId) {
      await notify({
        userId: notifyUserId,
        title: "Account blocked",
        body: "Your seller account has been blocked by KARMA admin.",
        type: "RETAILER",
        link: "/seller",
      });
    }
  }

  return NextResponse.json({ ok: true, retailer: updated });
}
