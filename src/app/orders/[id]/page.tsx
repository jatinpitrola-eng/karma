"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate, parseImages } from "@/lib/format";
import { PartImg } from "@/components/product/part-img";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, OrderTimeline } from "@/components/product/status-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Order = {
  id: string;
  code: string;
  status: string;
  total: number;
  itemsTotal: number;
  deliveryFee: number;
  discount: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  address: { name: string; phone: string; pincode: string; line: string; city: string; state?: string };
  items: { id: string; name: string; image: string; price: number; qty: number; storeName?: string | null }[];
  events: { id: string; status: string; createdAt: string }[];
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/orders/${id}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setOrder(d.order);
      })
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(load, [load]);

  const cancelOrder = async () => {
    const res = await fetch(`/api/orders/${id}`, { method: "PATCH" });
    if (res.ok) {
      import("sonner").then(({ toast }) => toast.success(t("orders.cancelled")));
      load();
    } else {
      import("sonner").then(({ toast }) => toast.error(t("orders.cancelNotAllowed")));
    }
  };

  if (missing) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center">
        <p className="text-sm font-semibold">{t("product.notFound")}</p>
        <Button className="mt-4" onClick={() => router.push("/orders")}>{t("orders.title")}</Button>
      </div>
    );
  }

  if (!order) return <Skeleton className="h-96 rounded-xl" />;

  const canCancel = order.status === "PLACED" || order.status === "CONFIRMED";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/orders" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label={t("common.back")}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 font-mono text-sm font-bold">{order.code}</h1>
        <StatusBadge status={order.status} />
      </div>

      {/* items */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("orders.items")}</h2>
        <div className="mt-3 space-y-3">
          {order.items.map((it) => {
            const img = parseImages(it.image)[0];
            return (
              <div key={it.id} className="flex items-center gap-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded border border-border/60 bg-white">
                  <PartImg src={img.url} alt={it.name} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  {it.storeName && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      <span aria-hidden>🛍</span> {it.storeName}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {t("common.qty")}: {it.qty} × {formatINR(it.price)}
                  </p>
                </div>
                <span className="text-sm font-bold">{formatINR(it.price * it.qty)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.itemsTotal")}</span>
            <span className="font-medium">{formatINR(order.itemsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.deliveryFee")}</span>
            <span className={`font-medium ${order.deliveryFee === 0 ? "text-green-700" : ""}`}>
              {order.deliveryFee === 0 ? t("common.free") : formatINR(order.deliveryFee)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>{t("cart.couponApplied", { code: order.couponCode ?? "" })}</span>
              <span className="font-medium">−{formatINR(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>{t("cart.grandTotal")}</span>
            <span>{formatINR(order.total)}</span>
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground">
            {t("orders.paymentMethod")}: <span className="font-semibold text-foreground">{order.paymentMethod}</span>
            {order.paymentMethod === "COD" && order.paymentStatus !== "PAID" ? ` (${t("checkout.codDesc")})` : ""}
          </p>
        </div>
      </section>

      {/* timeline */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="mb-3.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("orders.timeline")}</h2>
        <OrderTimeline events={order.events} status={order.status} />
        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            🚚 {t("orders.deliveryEst")}
          </p>
        )}
      </section>

      {/* address */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {t("checkout.deliveryAddress")}
        </h2>
        <p className="mt-2 text-sm font-bold">
          {order.address?.name} <span className="font-normal text-muted-foreground">· {order.address?.phone}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {order.address?.line}, {order.address?.city} — {order.address?.pincode}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("orders.placedOn")}: {formatDate(order.createdAt)}
        </p>
      </section>

      {canCancel && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="h-11 w-full border-red-200 font-bold text-red-600 hover:bg-red-50">
              <Ban className="mr-2 h-4 w-4" /> {t("orders.cancel")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-sm rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("orders.cancelTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("orders.cancelBody")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={cancelOrder}>
                {t("common.yes")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
