import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

// Serverless-safe cart: lives in a signed, httpOnly cookie instead of the DB,
// because Vercel lambda instances have independent ephemeral /tmp SQLite
// copies — a DB cart would vanish between instances. The session works the
// same way (see src/lib/session.ts). Product/stock data is still validated
// against the DB on every read (users/products are identical in every seeded
// instance).

export const CART_COOKIE = "pk_cart";
const MAX_LINES = 20;
const MAX_QTY = 99;

export type CartLine = { productId: string; qty: number };

function secret(): string {
  return process.env.SESSION_SECRET || "karma-demo-secret-v1";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function packCart(lines: CartLine[]): string {
  const clean = lines
    .filter((l) => typeof l.productId === "string" && l.productId.length > 0)
    .slice(0, MAX_LINES)
    .map((l) => ({ productId: l.productId, qty: Math.min(MAX_QTY, Math.max(1, Math.round(l.qty))) }));
  const payload = Buffer.from(JSON.stringify(clean)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseCart(req: NextRequest): CartLine[] {
  const raw = req.cookies.get(CART_COOKIE)?.value;
  if (!raw) return [];
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return [];
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expect = sign(payload);
  if (sig.length !== expect.length) return [];
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return [];
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.productId === "string" && Number.isFinite(l.qty))
      .slice(0, MAX_LINES)
      .map((l) => ({ productId: l.productId, qty: Math.min(MAX_QTY, Math.max(1, Math.round(l.qty))) }));
  } catch {
    return [];
  }
}

export function setCartCookie(res: NextResponse, lines: CartLine[]) {
  res.cookies.set(CART_COOKIE, packCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.VERCEL === "1",
  });
}

export function clearCartCookie(res: NextResponse) {
  res.cookies.set(CART_COOKIE, "", { path: "/", maxAge: 0, secure: process.env.VERCEL === "1" });
}
