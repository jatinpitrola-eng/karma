"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, ShieldCheck, RefreshCcw, BadgeCheck, Minus, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, discountPct, parseImages } from "@/lib/format";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localizedCatName } from "@/lib/i18n";

type Product = {
  id: string;
  slug: string;
  name: string;
  partNumber: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  images: string;
  category: { slug: string; name: string; nameHi: string; nameGu: string };
  retailer: { id: string; businessName: string; city: string };
  vehicles: { id: string; brand: string; model: string; type: string; key: string }[];
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const refresh = useSession((s) => s.refresh);

  const [p, setP] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setP(d.product);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="grid place-items-center rounded-xl border bg-card py-20 text-center">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-sm font-semibold">{t("product.notFound")}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const off = discountPct(p.price, p.mrp);
  const images = parseImages(p.images);

  const addToCart = async (goCart = false) => {
    if (!me) {
      router.push("/auth/login?next=" + encodeURIComponent(`/product/${p.slug}`));
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, qty }),
      });
      if (res.ok) {
        await refresh();
        setAdded(true);
        import("sonner").then(({ toast }) => toast.success(t("product.addedToCart")));
        if (goCart) router.push("/cart");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      {/* Gallery */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <div className={`relative grid aspect-[4/3] place-items-center bg-gradient-to-br ${images[imgIdx]?.g ?? images[0].g}`}>
          <span className="text-8xl drop-shadow" aria-hidden>{images[imgIdx]?.e ?? "🔧"}</span>
          {off > 0 && (
            <span className="absolute left-3 top-3 rounded-md bg-green-600 px-2 py-1 text-xs font-bold text-white">
              {t("common.off", { n: off })}
            </span>
          )}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 p-2.5">
          {images.map((im, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`grid h-14 w-14 place-items-center rounded-lg border-2 bg-gradient-to-br text-xl ${im.g} ${i === imgIdx ? "border-primary" : "border-transparent"}`}
              aria-label={`Thumbnail ${i + 1}`}
            >
              {im.e ?? "🔧"}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <p className="text-[11px] font-medium text-primary">{localizedCatName(p.category, lang)}</p>
        <h1 className="mt-0.5 text-lg font-bold leading-snug">{p.name}</h1>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-extrabold">{formatINR(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">{formatINR(p.mrp)}</span>
              <span className="text-sm font-bold text-green-700">{t("common.off", { n: off })}</span>
            </>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          {p.stock > 0 ? (
            <span className="font-semibold text-green-700">
              {p.stock < 5 ? t("product.lowStock", { n: p.stock }) : t("product.inStock")}
            </span>
          ) : (
            <span className="font-semibold text-red-600">{t("product.outOfStock")}</span>
          )}
          <span className="text-muted-foreground">{t("product.deliveryIn")}</span>
        </div>

        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("product.freeDelivery")} · {t("product.replacedSoon")} · {t("product.codAvailable")}
        </p>

        {/* retailer */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary p-2.5">
          <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate text-xs">
            <span className="text-muted-foreground">{t("product.soldBy")}: </span>
            <span className="font-bold">{p.retailer.businessName}</span>
            <span className="text-muted-foreground"> · {t("product.verifiedSeller")}</span>
          </p>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{p.retailer.city}</span>
        </div>

        {/* qty + CTA */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center rounded-lg border">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-bold">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(p.stock, q + 1))}
              className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[11px] text-muted-foreground">{p.stock} {t("product.stockUnit")}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            className="h-11 border-primary font-bold text-primary hover:bg-secondary"
            disabled={p.stock === 0 || adding}
            onClick={() => addToCart(false)}
          >
            {added ? t("product.goToCart") : t("product.addToCart")}
          </Button>
          <Button className="h-11 font-bold" disabled={p.stock === 0 || adding} onClick={() => addToCart(true)}>
            {t("product.buyNow")}
          </Button>
        </div>
      </div>

      {/* Fits vehicles */}
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <h2 className="text-sm font-bold">{t("product.compatibleVehicles")}</h2>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {p.vehicles.map((v) => (
            <span key={v.id} className="rounded-full border bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
              {v.brand} {v.model}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">{t("product.description")}</h2>
          <span className="text-[11px] text-muted-foreground">{t("product.partNumber")}: {p.partNumber}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-green-600" /> {t("product.verifiedSeller")}</span>
          <span className="flex items-center gap-1"><RefreshCcw className="h-3.5 w-3.5 text-green-600" /> {t("product.replacedSoon")}</span>
        </div>
      </div>
    </div>
  );
}
