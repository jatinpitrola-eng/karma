"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate, parseImages } from "@/lib/format";
import { PartImg } from "@/components/product/part-img";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/product/status-badge";

type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: { id: string; name: string; image: string; qty: number }[];
};

export default function OrdersPage() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (me === null && !useSession.getState().loading) setOrders([]);
    if (!me) return;
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, [me]);

  if (me === null && !useSession.getState().loading) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center">
        <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold">{t("orders.loginRequired")}</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login?next=/orders")}>{t("account.loginNow")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="px-1 text-lg font-bold">{t("orders.title")}</h1>

      {orders === null ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : orders.length === 0 ? (
        <div className="grid place-items-center rounded-md bg-card py-16 text-center">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold">{t("orders.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("orders.emptySub")}</p>
          <Button className="mt-5" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
        </div>
      ) : (
        orders.map((o) => {
          const img = o.items[0] ? parseImages(o.items[0].image)[0] : null;
          return (
            <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-md bg-card p-4 shadow-fk transition-shadow hover:shadow-pop">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-muted-foreground">{o.code}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                {img && (
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded border border-border/60 bg-white">
                    <PartImg src={img.url} alt={o.items[0]?.name ?? ""} className="h-full w-full object-cover" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {o.items[0]?.name ?? ""}
                    {o.items.length > 1 && <span className="text-muted-foreground"> +{o.items.length - 1}</span>}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("orders.placedOn")} {formatDate(o.createdAt)} · {t("orders.paymentMethod")}: {o.paymentMethod}
                  </p>
                  <p className="mt-0.5 text-sm font-bold">{formatINR(o.total)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
