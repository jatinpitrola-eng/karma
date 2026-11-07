import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pk_session";

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string; // CUSTOMER | RETAILER | ADMIN
};

const SESSION_TTL_DAYS = 30;

function secret(): string {
  return process.env.SESSION_SECRET || "karma-demo-secret-v1";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

// Stateless signed token "<userId>.<expEpochMs>.<hmac>" — survives serverless
// instance resets (Vercel /tmp is ephemeral; user rows are identical in every
// seeded instance, so roles still resolve on any instance).
export function makeSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_TTL_DAYS * 86_400_000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function parseSignedToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const payload = `${userId}.${exp}`;
  const expect = sign(payload);
  if (sig.length !== expect.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  if (Number(exp) <= Date.now()) return null;
  return userId;
}

export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined | null;
  if (req) {
    token = req.cookies.get(SESSION_COOKIE)?.value;
  } else {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  }
  if (!token) return null;

  // 1) Classic DB-backed session (local dev, warm sticky instance)
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (session) {
    return {
      id: session.user.id,
      phone: session.user.phone,
      name: session.user.name,
      role: session.user.role,
    };
  }

  // 2) Stateless signed token fallback (serverless: /tmp may have been
  //    reseeded since login — the signed cookie still authenticates)
  const userId = parseSignedToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { id: user.id, phone: user.phone, name: user.name, role: user.role };
}

export async function requireUser(req?: NextRequest): Promise<SessionUser> {
  const u = await getSessionUser(req);
  if (!u) throw new AuthError("NOT_LOGGED_IN");
  return u;
}

export async function requireRole(req: NextRequest | undefined, roles: string[]): Promise<SessionUser> {
  const u = await requireUser(req);
  if (!roles.includes(u.role)) throw new AuthError("FORBIDDEN");
  return u;
}

export class AuthError extends Error {
  constructor(public code: "NOT_LOGGED_IN" | "FORBIDDEN") {
    super(code);
  }
}

// Full session payload (user + retailer context)
export async function getSessionFull(req?: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return null;
  let retailer = null;
  if (user.role === "RETAILER") {
    const r = await db.retailer.findUnique({ where: { userId: user.id } });
    retailer = r
      ? {
          id: r.id,
          businessName: r.businessName,
          ownerName: r.ownerName,
          phone: r.phone,
          city: r.city,
          categorySlugs: r.categorySlugs,
          status: r.status,
        }
      : null;
  }
  return { user, retailer };
}
