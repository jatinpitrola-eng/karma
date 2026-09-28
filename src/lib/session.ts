import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pk_session";

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  role: string; // CUSTOMER | RETAILER | ADMIN
};

export async function getSessionUser(req?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined | null;
  if (req) {
    token = req.cookies.get(SESSION_COOKIE)?.value;
  } else {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  }
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  return {
    id: session.user.id,
    phone: session.user.phone,
    name: session.user.name,
    role: session.user.role,
  };
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
