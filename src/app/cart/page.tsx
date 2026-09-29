"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, parseImages } from "@/lib/format";
import { useSession, useVehicleStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PartImg } from "@/components/product/part-img";

type CartItem = {
  id: string;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
    images: string;
    retailer: { businessName: string };
  };
};

type CartData = { items: CartItem[]; itemsTotal: number; deliveryFee: number; cartCount: number } | null;

export default function CartPage() {
  const { t } = useI18n();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const refresh = useSession((s) => s.refresh);
  const vehicle = useVehicleStore((s) => s.vehicle);
  const [cart, setCart] = useState<CartData>(null);
  const [coupon, setCoupon] = useState("");
  const [couponOk, setCouponOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      setCart(await res.json());
    } catch {
      setCart({ items: [], itemsTotal: 0, deliveryFee: 0, cartCount: 0 });
    }
  }, []);

  useEffect(() => {
    if (me !== null) load();
    else if (!useSession.getState().loading) setCart({ items: [], itemsTotal: 0, deliveryFee: 0, cartCount: 0 });
  }, [me, load]);

  const updateQty = async (productId: string, qty: number) => {
    const res = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty }),
    });
    if (res.ok) {
      setCart(await res.json());
      refresh();
    }
  };

  const removeItem = async (productId: string) => {
    const res = await fetch(`/api/cart?productId=${productId}`, { method: "DELETE" });
    if (res.ok) {
      setCart(await res.json());
      refresh();
      import("sonner").then(({ toast }) => toast.success(t("cart.itemRemoved")));
    }
  };

  const applyCoupon = async () => {
    if (!cart) return;
    setBusy(true);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, itemsTotal: cart.itemsTotal }),
      });
      const data = await res.json();
      if (data.ok) {
        setCouponOk(data.code);
        sessionStorage.setItem("pk_coupon", data.code);
        import("sonner").then(({ toast }) => toast.success(t("cart.couponApplied", { code: data.code })));
      } else {
        setCouponOk(null);
        sessionStorage.removeItem("pk_coupon");
        import("sonner").then(({ toast }) => toast.error(t("cart.couponInvalid")));
      }
    } finally {
      setBusy(false);
    }
  };

  if (me === null && !useSession.getState().loading) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center shadow-fk">
        <ShoppingCart className="mb-3 h-10 w-10 text-fk-muted/40" />
        <p className="text-sm font-semibold text-fk-text">{t("cart.loginToSeeCart")}</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login?next=/cart")}>{t("account.loginNow")}</Button>
      </div>
    );
  }

  if (cart === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-md" />
        <Skeleton className="h-28 rounded-md" />
      </div>
    );
  }

  const discount = couponOk === "DEMO10" ? Math.round(cart.itemsTotal * 0.1) : 0;
  const total = cart.itemsTotal + cart.deliveryFee - discount;
  const mrpTotal = cart.items.reduce((s, it) => s + it.product.mrp * it.qty, 0);

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold text-fk-text">
        {t("cart.title")} <span className="text-sm font-normal text-fk-muted">({cart.cartCount})</span>
      </h1>

      {cart.items.length === 0 ? (
        <div className="grid place-items-center rounded-md bg-card py-16 text-center shadow-fk">
          <ShoppingCart className="mb-3 h-12 w-12 text-fk-muted/30" />
          <p className="text-sm font-semibold text-fk-text">{t("cart.empty")}</p>
          <p className="mt-1 text-xs text-fk-muted">{t("cart.emptySub")}</p>
          <Button className="mt-5" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
        </div>
      ) : (
        <>
          {/* items */}
          <div className="divide-y divide-border overflow-hidden rounded-md bg-card shadow-fk">
            {cart.items.map((it) => {
              const img = parseImages(it.product.images)[0];
              return (
                <div key={it.id} className="flex gap-3 p-3">
                  <Link href={`/product/${it.product.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded border border-border/60 bg-white">
                    <PartImg src={img.url} alt={it.product.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${it.product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug text-fk-text hover:text-fk-blue">
                      {it.product.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-fk-muted">{it.product.retailer.businessName}</p>
                    {vehicle && (
                      <p className="mt-0.5 text-[11px] font-bold text-fk-green">
                        ✓ {t("product.fitsVehicle", { n: `${vehicle.brand} ${vehicle.model}` })}
                      </p>
                    )}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-fk-text">{formatINR(it.product.price)}</span>
                      {it.product.mrp > it.product.price && (
                        <span className="text-xs text-fk-muted line-through">{formatINR(it.product.mrp)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded border border-border">
                        <button onClick={() => updateQty(it.product.id, it.qty - 1)} className="grid h-8 w-8 place-items-center text-fk-muted" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-fk-text">{it.qty}</span>
                        <button onClick={() => updateQty(it.product.id, it.qty + 1)} className="grid h-8 w-8 place-items-center text-fk-muted" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(it.product.id)} className="flex items-center gap-1 text-xs font-bold text-fk-muted hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" /> {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* coupon */}
          <div className="rounded-md bg-card p-3.5 shadow-fk">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-fk-green" />
              <p className="flex-1 text-sm font-semibold text-fk-text">{t("cart.coupon")}</p>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="DEMO10"
                className="h-10 flex-1 font-mono uppercase"
              />
              <Button variant="outline" className="h-10 border-fk-blue font-bold text-fk-blue hover:bg-accent" disabled={busy} onClick={applyCoupon}>
                {t("cart.couponApply")}
              </Button>
            </div>
            {couponOk && <p className="mt-2 text-xs font-bold text-fk-green">{t("cart.couponApplied", { code: couponOk })}</p>}
          </div>

          {/* Price Details — Flipkart layout */}
          <div className="rounded-md bg-card p-4 shadow-fk">
            <p className="border-b border-dashed border-border pb-2 text-xs font-bold uppercase tracking-wide text-fk-muted">
              {t("cart.priceDetails")}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-fk-text">{t("cart.priceItems", { n: cart.cartCount })}</span>
                <span className="font-medium text-fk-text">{formatINR(mrpTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fk-text">{t("cart.discount")}</span>
                <span className="font-medium text-fk-green">− {formatINR(mrpTotal - cart.itemsTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-fk-text">{t("cart.coupon")} ({couponOk})</span>
                  <span className="font-medium text-fk-green">− {formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-fk-text">{t("cart.deliveryFee")}</span>
                <span className={`font-medium ${cart.deliveryFee === 0 ? "font-bold text-fk-green" : "text-fk-text"}`}>
                  {cart.deliveryFee === 0 ? t("common.free") : formatINR(cart.deliveryFee)}
                </span>
              </div>
              <p className="text-[11px] text-fk-muted">{t("cart.deliveryNote")}</p>
              <div className="flex justify-between border-t border-dashed border-border pt-3 text-base font-bold">
                <span className="text-fk-text">{t("cart.totalAmount")}</span>
                <span className="text-fk-text">{formatINR(total)}</span>
              </div>
            </div>
            <p className="mt-2 rounded-sm bg-green-50 px-2.5 py-2 text-xs font-bold text-fk-green">
              {t("cart.youWillSave", { n: mrpTotal - cart.itemsTotal + discount })}
            </p>
            <Button
              className="mt-3.5 h-11 w-full rounded-sm bg-fk-coral font-bold text-white hover:bg-fk-orange"
              onClick={() => router.push(`/checkout${couponOk ? "?coupon=DEMO10" : ""}`)}
            >
              {t("cart.proceed")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
