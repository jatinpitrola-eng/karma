"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Plus, Store, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SellerGate({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { me, loading } = useSession();

  if (loading) return <div className="py-16" />;

  if (!me) {
    return (
      <div className="mx-auto grid max-w-md place-items-center rounded-xl border bg-card py-16 text-center">
        <Store className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold">{t("seller.loginAsRetailer")}</p>
        <Link href="/auth/login?next=/seller" className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
          {t("auth.login")}
        </Link>
      </div>
    );
  }

  if (me.retailer && me.retailer.status === "BLOCKED") {
    return (
      <div className="mx-auto grid max-w-md place-items-center rounded-xl border bg-card py-16 px-6 text-center">
        <p className="text-3xl">⛔</p>
        <p className="mt-3 text-sm font-semibold">{t("seller.blocked")}</p>
      </div>
    );
  }

  if (me.retailer && me.retailer.status === "PENDING") {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-soft">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600 live-dot" />
        </span>
        <h1 className="mt-4 text-base font-bold">{t("seller.pendingTitle")}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{t("seller.pendingBody")}</p>
        <div className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">
          {me.retailer.businessName} · PENDING
        </div>
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
          {t("cart.startShopping")} →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export function SellerNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/seller", label: t("seller.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/seller/products", label: t("seller.myProducts"), icon: Package },
    { href: "/seller/orders", label: t("seller.myOrders"), icon: ShoppingCart },
  ];
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {items.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {i.label}
          </Link>
        );
      })}
      <Link
        href="/seller/products/new"
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("seller.addProduct")}
      </Link>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3.5 shadow-soft", accent ? "bg-gradient-to-br from-orange-500 to-red-500 text-white" : "bg-card")}>
      <p className={cn("text-[11px] font-medium", accent ? "text-white/80" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 truncate text-lg font-extrabold">{value}</p>
    </div>
  );
}

export function useSellerStats() {
  const [stats, setStats] = useState<{ totalProducts: number; totalOrders: number; revenue: number; pendingOrders: number } | null>(null);
  const load = useCallback(() => {
    fetch("/api/retailer/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => (d.ok ? setStats(d.stats) : setStats(null)))
      .catch(() => setStats(null));
  }, []);
  useEffect(load, [load]);
  return { stats, reload: load, fmt: formatINR };
}
