"use client";
import { useCallback, useEffect, useState } from "react";
import { Shield, LayoutDashboard, Store, Package, ShoppingCart, Users, AlertTriangle, Check, Ban, ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate, discountPct } from "@/lib/format";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Tab = "dashboard" | "approvals" | "products" | "orders" | "retailers" | "customers" | "lowstock";

const ALL_STATUSES = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminPage() {
  const { t } = useI18n();
  const { me, loading } = useSession();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  // data
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [retailers, setRetailers] = useState<AdminRetailer[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [lowStock, setLowStock] = useState<AdminProduct[] | null>(null);

  const isAdmin = me?.role === "ADMIN";

  const adminLogin = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setStep("otp");
    } finally {
      setBusy(false);
    }
  };

  const adminVerify = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (data.ok && data.user.role === "ADMIN") {
        useSession.getState().setMe(data.user);
        import("sonner").then(({ toast }) => toast.success(t("auth.loginSuccess")));
      } else {
        import("sonner").then(({ toast }) => toast.error(t("admin.unauthorised")));
      }
    } finally {
      setBusy(false);
    }
  };

  const loadTab = useCallback(
    (which: Tab) => {
      const get = (url: string, setter: (d: never) => void) =>
        fetch(url, { cache: "no-store" })
          .then((r) => r.json())
          .then((d) => setter(d))
          .catch(() => {});
      if (which === "dashboard") get("/api/admin/stats", (d) => setStats((d as { stats: Record<string, number> }).stats));
      if (which === "approvals" || which === "retailers") get("/api/admin/retailers", (d) => setRetailers((d as { retailers: AdminRetailer[] }).retailers));
      if (which === "products") get("/api/admin/products", (d) => setProducts((d as { products: AdminProduct[] }).products));
      if (which === "orders") get("/api/admin/orders", (d) => setOrders((d as { orders: AdminOrder[] }).orders));
      if (which === "customers") get("/api/admin/customers", (d) => setCustomers((d as { customers: AdminCustomer[] }).customers));
      if (which === "lowstock") get("/api/admin/low-stock", (d) => setLowStock((d as { products: AdminProduct[] }).products));
    },
    []
  );

  useEffect(() => {
    if (isAdmin) loadTab(tab);
  }, [tab, isAdmin, loadTab]);

  // ---- secret login screen (no hints about demo accounts) ----
  if (!loading && !isAdmin) {
    return (
      <div className="mx-auto max-w-sm">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-stone-800 shadow-pop">
              <Shield className="h-8 w-8 text-white" />
            </span>
            <h1 className="mt-3 text-lg font-extrabold">{t("admin.loginTitle")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.loginSub")}</p>
          </div>
          <div className="mt-6 space-y-3.5">
            {step === "phone" ? (
              <>
                <Input
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder={t("auth.phonePlaceholder")}
                  className="h-12 text-center font-mono"
                />
                <Button className="h-11 w-full font-bold" disabled={busy || phone.length !== 10} onClick={adminLogin}>
                  {t("auth.sendOtp")}
                </Button>
                <p className="rounded-lg bg-muted px-3 py-2 text-center text-[11px] font-medium text-muted-foreground">
                  {t("auth.demoOtp")}
                </p>
              </>
            ) : (
              <>
                <Input
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="h-12 text-center font-mono text-xl tracking-[0.5em]"
                />
                <Button className="h-11 w-full font-bold" disabled={busy || otp.length < 4} onClick={adminVerify}>
                  {t("auth.verifyOtp")}
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">PartKart {t("admin.title")}</p>
      </div>
    );
  }

  if (!isAdmin) return <Skeleton className="h-96 rounded-xl" />;

  const tabs: { key: Tab; label: string; icon: typeof Shield }[] = [
    { key: "dashboard", label: t("admin.dashboard"), icon: LayoutDashboard },
    { key: "approvals", label: `${t("admin.approvals")}${stats?.retailersPending ? ` (${stats.retailersPending})` : ""}`, icon: Store },
    { key: "orders", label: t("admin.allOrders"), icon: ShoppingCart },
    { key: "products", label: t("admin.allProducts"), icon: Package },
    { key: "retailers", label: t("admin.allRetailers"), icon: Store },
    { key: "customers", label: t("admin.allCustomers"), icon: Users },
    { key: "lowstock", label: t("admin.lowStock"), icon: AlertTriangle },
  ];

  const setRetailerStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/retailers/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      import("sonner").then(({ toast }) =>
        toast.success(status === "APPROVED" ? t("admin.approvedToast") : t("admin.blockedToast"))
      );
      loadTab("approvals");
      loadTab("dashboard");
      if (tab === "retailers") loadTab("retailers");
    }
  };

  const setProductActive = async (id: string, active: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setProducts((prev) => (prev ?? []).map((p) => (p.id === id ? { ...p, active } : p)));
  };

  const forceStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTab("orders");
    import("sonner").then(({ toast }) => toast.success(t("common.updated")));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-stone-900 p-4 text-white shadow-soft">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
          <Shield className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h1 className="text-base font-bold">{t("admin.dashboard")}</h1>
          <p className="text-[11px] text-white/60">{t("admin.title")}</p>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold",
                tab === tb.key ? "border-stone-900 bg-stone-900 text-white" : "bg-card hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats === null ? (
            Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <Stat label={t("admin.revenue")} value={new Intl.NumberFormat("en-IN").format(stats.revenue)} dark />
              <Stat label={t("admin.orders")} value={String(stats.orders)} />
              <Stat label={t("admin.customers")} value={String(stats.customers)} />
              <Stat label={t("admin.products")} value={String(stats.products)} />
              <Stat label={t("admin.retailersApproved")} value={String(stats.retailersApproved)} />
              <Stat label={t("admin.retailersPending")} value={String(stats.retailersPending)} warn={stats.retailersPending > 0} />
              <Stat label={t("admin.lowStock")} value={String(stats.lowStock)} warn={stats.lowStock > 0} />
            </>
          )}
        </div>
      )}

      {/* APPROVALS */}
      {tab === "approvals" && (
        <div className="space-y-2.5">
          {retailers === null ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : retailers.filter((r) => r.status === "PENDING").length === 0 ? (
            <div className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">{t("admin.noPending")}</div>
          ) : (
            retailers
              .filter((r) => r.status === "PENDING")
              .map((r) => (
                <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold">{r.businessName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.ownerName} · +91 {r.phone} · {r.city} · {t("cat.allCategories")}: {r.categorySlugs.split(",").length}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="h-9 gap-1 bg-green-600 font-bold hover:bg-green-700" onClick={() => setRetailerStatus(r.id, "APPROVED")}>
                      <Check className="h-4 w-4" /> {t("admin.approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 gap-1 border-red-200 font-bold text-red-600 hover:bg-red-50" onClick={() => setRetailerStatus(r.id, "BLOCKED")}>
                      <Ban className="h-4 w-4" /> {t("admin.block")}
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <div className="space-y-2.5">
          {orders === null ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-xl border bg-card p-3.5 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold">{o.code}</span>
                  <Select value={o.status} onValueChange={(v) => forceStatus(o.id, v)}>
                    <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{t(`orders.status.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {o.customer?.name} · +91 {o.customer?.phone} · {formatDate(o.createdAt)} · {o.paymentMethod}
                </p>
                <p className="mt-1 text-xs">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>
                <p className="mt-1 text-sm font-bold">{formatINR(o.total)}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "products" && (
        <div className="space-y-2">
          {products === null ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {p.retailer?.businessName} · {formatINR(p.price)} ({t("common.off", { n: discountPct(p.price, p.mrp) })}) · {t("admin.stock")}: {p.stock}
                  </p>
                </div>
                <Button size="sm" variant={p.active ? "outline" : "default"} className="h-8 text-xs" onClick={() => setProductActive(p.id, !p.active)}>
                  {p.active ? t("common.disable") : t("common.enable")}
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* RETAILERS */}
      {tab === "retailers" && (
        <div className="space-y-2">
          {retailers === null ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            retailers.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-3.5 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.businessName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.ownerName} · {r.city} · {r.productCount} {t("admin.products")}
                    </p>
                  </div>
                  <StatusChip status={r.status} />
                </div>
                <div className="mt-2.5 flex gap-2">
                  {r.status !== "APPROVED" && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 border-green-200 text-xs font-bold text-green-700 hover:bg-green-50" onClick={() => setRetailerStatus(r.id, "APPROVED")}>
                      <Check className="h-3.5 w-3.5" /> {t("admin.approve")}
                    </Button>
                  )}
                  {r.status !== "BLOCKED" && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 border-red-200 text-xs font-bold text-red-600 hover:bg-red-50" onClick={() => setRetailerStatus(r.id, "BLOCKED")}>
                      <Ban className="h-3.5 w-3.5" /> {t("admin.block")}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CUSTOMERS */}
      {tab === "customers" && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          {customers === null ? (
            <Skeleton className="h-40" />
          ) : customers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">—</p>
          ) : (
            customers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border-b p-3.5 last:border-0">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                  {(c.name ?? "U").slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name ?? "—"}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">+91 {c.phone}</p>
                </div>
                <span className="text-xs font-bold">{c.orderCount} {t("admin.orders")}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* LOW STOCK */}
      {tab === "lowstock" && (
        <div className="space-y-2">
          <p className="px-1 text-xs text-muted-foreground">{t("admin.lowStockSub")}</p>
          {lowStock === null ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : lowStock.length === 0 ? (
            <div className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">✓ {t("common.ok")}</div>
          ) : (
            lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.retailer?.businessName} · {p.partNumber}</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", p.stock <= 2 ? "bg-red-600 text-white" : "bg-red-100 text-red-700")}>
                  {t("admin.stock")}: {p.stock}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, dark, warn }: { label: string; value: string; dark?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-3.5 shadow-soft", dark ? "border-stone-900 bg-stone-900 text-white" : "bg-card", warn && "border-red-200 bg-red-50")}>
      <p className={cn("text-[11px] font-medium", dark ? "text-white/60" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useI18n();
  const map: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-amber-100 text-amber-700",
    BLOCKED: "bg-red-100 text-red-700",
  };
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold", map[status])}>{status}</span>;
}

type AdminRetailer = { id: string; businessName: string; ownerName: string; phone: string; city: string; categorySlugs: string; status: string; productCount: number };
type AdminProduct = { id: string; name: string; partNumber: string; price: number; mrp: number; stock: number; active: boolean; retailer: { businessName: string } };
type AdminOrder = { id: string; code: string; status: string; total: number; paymentMethod: string; createdAt: string; customer: { name: string | null; phone: string }; items: { name: string; qty: number }[] };
type AdminCustomer = { id: string; name: string | null; phone: string; orderCount: number };
