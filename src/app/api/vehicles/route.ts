import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/vehicles — full vehicle master grouped by type
export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { brand: "asc" }, { model: "asc" }],
    });
    return NextResponse.json({ vehicles });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ vehicles: [] }, { status: 500 });
  }
}
