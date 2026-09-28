"use client";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate, parseImages } from "@/lib/format";
import { SellerGate, SellerNav } from "../seller-ui";
import { StatusBadge } from "@/components/product/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ROrder = {
  id: string;
  code: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer: { name: string | null; phone: string };
  address: { line?: string; city?: string; pincode?: string };
  myItems: { id: string; name: string; image: string; price: number; qty: number }[];
  events: { id: string; status: string; createdAt: string }[];
};

const nextAction: Record<string, { label: string; status: string } | null> = {
  PLACED: { label: "seller.markConfirmed", status: "CONFIRMED" },
  CONFIRMED: { label: "seller.markPacked", status: "PACKED" },
  PACKED: { label: "seller.markShipped", status: "SHIPPED" },
  SHIPPED: null,
  DELIVERED: null,
  CANCELLED: null,
};

export default function SellerOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<ROrder[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/retailer/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000); // light refresh for new orders
    return () => clearInterval(timer);
  }, [load]);

  const advance = async (id: string, status: string) => {
    const res = await fetch(`/api/retailer/orders/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      import("sonner").then(({ toast }) => toast.success(t("common.updated")));
      load();
    } else {
      import("sonner").then(({ toast }) => toast.error(t("common.error")));
    }
  };

  return (
    <SellerGate>
      <div className="space-y-4">
        <h1 className="px-1 text-lg font-bold">{t("seller.myOrders")}</h1>
        <SellerNav />

        {orders === null ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : orders.length === 0 ? (
          <div className="rounded-xl border bg-card py-14 text-center">
            <p className="text-2xl">📦</p>
            <p className="mt-2 text-sm font-semibold">{t("seller.noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const action = nextAction[o.status];
              return (
                <div key={o.id} className="rounded-xl border bg-card p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{o.code}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {o.customer?.name ?? ""} · +91 {o.customer?.phone} · {formatDate(o.createdAt)} · {o.paymentMethod}
                  </p>

                  <div className="mt-3 space-y-2">
                    {o.myItems.map((it) => {
                      const img = parseImages(it.image)[0];
                      return (
                        <div key={it.id} className="flex items-center gap-3">
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-xl ${img.g}`}>
                            {img.e ?? "🔧"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{it.name}</p>
                            <p className="text-[11px] text-muted-foreground">{t("common.qty")}: {it.qty}</p>
                          </div>
                          <span className="text-sm font-bold">{formatINR(it.price * it.qty)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    📍 {o.address?.line}, {o.address?.city} — {o.address?.pincode}
                  </p>

                  {action && (
                    <Button size="sm" className="mt-3 h-9 font-bold" onClick={() => advance(o.id, action.status)}>
                      {t(action.label)} →
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SellerGate>
  );
}
