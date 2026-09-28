"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, parseImages } from "@/lib/format";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
  };

  if (me === null && !useSession.getState().loading) {
    return (
      <div className="grid place-items-center rounded-xl border bg-card py-16 text-center">
        <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold">{t("cart.loginToSeeCart")}</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login?next=/cart")}>{t("account.loginNow")}</Button>
      </div>
    );
  }

  if (cart === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  const discount = couponOk === "DEMO10" ? Math.round(cart.itemsTotal * 0.1) : 0;
  const total = cart.itemsTotal + cart.deliveryFee - discount;

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">
        {t("cart.title")} <span className="text-sm font-normal text-muted-foreground">({cart.cartCount})</span>
      </h1>

      {cart.items.length === 0 ? (
        <div className="grid place-items-center rounded-xl border bg-card py-16 text-center">
          <ShoppingCart className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm font-semibold">{t("cart.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("cart.emptySub")}</p>
          <Button className="mt-5" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
        </div>
      ) : (
        <>
          {/* items */}
          <div className="space-y-2.5">
            {cart.items.map((it) => {
              const img = parseImages(it.product.images)[0];
              return (
                <div key={it.id} className="flex gap-3 rounded-xl border bg-card p-3 shadow-soft">
                  <Link href={`/product/${it.product.slug}`} className={`grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-3xl ${img.g}`}>
                    {img.e ?? "🔧"}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${it.product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
                      {it.product.name}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{it.product.retailer.businessName}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold">{formatINR(it.product.price)}</span>
                      {it.product.mrp > it.product.price && (
                        <span className="text-[11px] text-muted-foreground line-through">{formatINR(it.product.mrp)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border">
                        <button onClick={() => updateQty(it.product.id, it.qty - 1)} className="grid h-8 w-8 place-items-center text-muted-foreground" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{it.qty}</span>
                        <button onClick={() => updateQty(it.product.id, it.qty + 1)} className="grid h-8 w-8 place-items-center text-muted-foreground" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(it.product.id)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                        <Trash2 className="h-3.5 w-3.5" /> {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* coupon */}
          <div className="rounded-xl border bg-card p-3.5 shadow-soft">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <p className="flex-1 text-sm font-semibold">{t("cart.couponPlaceholder")}</p>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="DEMO10"
                className="h-10 flex-1 font-mono uppercase"
              />
              <Button variant="outline" className="h-10 font-bold text-primary" onClick={applyCoupon}>
                {t("cart.couponApply")}
              </Button>
            </div>
            {couponOk && <p className="mt-2 text-xs font-semibold text-green-700">{t("cart.couponApplied", { code: couponOk })}</p>}
          </div>

          {/* summary */}
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("checkout.orderSummary")}</p>
            <div className="mt-2.5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.itemsTotal")}</span>
                <span className="font-medium">{formatINR(cart.itemsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.deliveryFee")}</span>
                <span className={`font-medium ${cart.deliveryFee === 0 ? "text-green-700" : ""}`}>
                  {cart.deliveryFee === 0 ? t("common.free") : formatINR(cart.deliveryFee)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>{t("cart.couponApplied", { code: "DEMO10" })}</span>
                  <span className="font-medium">−{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>{t("cart.grandTotal")}</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">{t("cart.deliveryNote")}</p>
            <Button
              className="mt-3.5 h-11 w-full font-bold"
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
