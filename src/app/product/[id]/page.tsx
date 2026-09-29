"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Star, BadgeCheck, Check, MapPin, Truck, ShieldCheck, ChevronRight, Share2, Store } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, discountPct, parseImages } from "@/lib/format";
import { useSession, useVehicleStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { localizedCatName } from "@/lib/i18n";
import { PartImg } from "@/components/product/part-img";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";

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

const BARS = [
  { star: 5, pct: 62 },
  { star: 4, pct: 24 },
  { star: 3, pct: 9 },
  { star: 2, pct: 3 },
  { star: 1, pct: 2 },
];

function deliveryLabel(): string {
  const d = new Date(Date.now() + 3 * 86400000);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, lang } = useI18n();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const refresh = useSession((s) => s.refresh);
  const vehicle = useVehicleStore((s) => s.vehicle);

  const [p, setP] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [similar, setSimilar] = useState<ProductCardData[] | null>(null);
  const [slide, setSlide] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [pin, setPin] = useState("380001");
  const [pinOk, setPinOk] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setP(d.product);
        fetch(`/api/products?category=${d.product.category.slug}&pageSize=10`)
          .then((r2) => r2.json())
          .then((d2) => setSimilar((d2.products ?? []).filter((x: ProductCardData) => x.id !== d.product.id).slice(0, 6)))
          .catch(() => setSimilar([]));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-20 text-center shadow-fk">
        <p className="text-4xl">🔍</p>
        <p className="mt-3 text-sm font-semibold text-fk-text">{t("product.notFound")}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-80 rounded-md" />
        <Skeleton className="h-8 w-3/4 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
      </div>
    );
  }

  const off = discountPct(p.price, p.mrp);
  const images = parseImages(p.images);
  const fits = vehicle ? p.vehicles.some((v) => v.id === vehicle.id) : false;
  const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model}` : "";

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

  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  const offers = ["product.offer1", "product.offer2", "product.offer3", "product.offer4"] as const;
  const highlights = ["product.h1", "product.h2", "product.h3", "product.h4"] as const;

  return (
    <div className="space-y-3 pb-4">
      {/* ============ Gallery — swipeable, dots, wishlist ============ */}
      <section className="relative overflow-hidden rounded-md bg-white shadow-fk">
        <div ref={galleryRef} onScroll={onGalleryScroll} className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar">
          {images.map((im, i) => (
            <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-white p-4">
              <PartImg src={im.url} alt={`${p.name} ${i + 1}`} eager={i === 0} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-fk-green px-2 py-0.5 text-xs font-bold text-white">
            {t("common.off", { n: off })}
          </span>
        )}
        <button aria-label="Wishlist" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-fk">
          <Heart className="h-4.5 w-4.5 text-fk-muted" />
        </button>
        <button aria-label="Share" className="absolute right-3 top-14 grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-fk">
          <Share2 className="h-4 w-4 text-fk-muted" />
        </button>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-5 bg-fk-blue" : "w-1.5 bg-fk-muted/40"}`} />
          ))}
        </div>
      </section>

      {/* ============ Title + rating + price ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <p className="text-xs text-fk-muted">{localizedCatName(p.category, lang)}</p>
        <h1 className="mt-0.5 text-base font-semibold leading-snug text-fk-text">{p.name}</h1>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1.5 py-0.5 text-[11px] font-bold text-white">
            4.3 <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
          </span>
          <span className="text-xs text-fk-muted">{t("product.reviewsCount")}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 py-0.5 text-[11px] font-bold text-fk-blue">
            <BadgeCheck className="h-3 w-3" aria-hidden /> {t("product.assured")}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold text-fk-text">{formatINR(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-sm text-fk-muted line-through">{formatINR(p.mrp)}</span>
              <span className="text-sm font-bold text-fk-green">{t("common.off", { n: off })}</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-xs text-fk-muted">{t("product.freeDelivery")}</p>

        <p className="mt-1.5 text-xs font-semibold">
          {p.stock > 0 ? (
            <span className="text-fk-green">
              {p.stock < 5 ? t("product.lowStock", { n: p.stock }) : t("product.inStock")}
            </span>
          ) : (
            <span className="text-red-600">{t("product.outOfStock")}</span>
          )}
          <span className="ml-3 font-normal text-fk-muted">{t("product.deliveryIn")}</span>
        </p>

        {/* qty stepper */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center rounded border border-border">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center text-fk-muted hover:text-fk-text" aria-label="Decrease quantity">−</button>
            <span className="w-9 text-center text-sm font-bold text-fk-text">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="grid h-9 w-9 place-items-center text-fk-muted hover:text-fk-text" aria-label="Increase quantity">+</button>
          </div>
          <span className="text-[11px] text-fk-muted">{p.stock} {t("product.stockUnit")}</span>
        </div>
      </section>

      {/* ============ Available offers ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-sm font-bold text-fk-text">{t("product.availableOffers")}</h2>
        <ul className="mt-2 space-y-1.5">
          {offers.map((k) => (
            <li key={k} className="flex items-start gap-2 text-[13px] text-fk-text">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fk-green" aria-hidden />
              {t(k)}
            </li>
          ))}
        </ul>
      </section>

      {/* ============ Compatibility ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        {vehicle && fits ? (
          <div className="flex items-center gap-2 rounded-sm bg-green-50 p-3">
            <BadgeCheck className="h-5 w-5 shrink-0 text-fk-green" aria-hidden />
            <p className="text-sm font-bold text-fk-green">{t("product.perfectFit", { n: vehicleLabel })}</p>
          </div>
        ) : vehicle && !fits ? (
          <div className="flex items-center gap-2 rounded-sm bg-red-50 p-3">
            <MapPin className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <p className="text-sm font-semibold text-red-700">{t("product.notFit", { n: vehicleLabel })}</p>
          </div>
        ) : (
          <Button
            variant="outline"
            className="h-10 w-full border-fk-blue font-bold text-fk-blue hover:bg-accent"
            onClick={() => router.push("/vehicle")}
          >
            {t("product.checkFitment")}
          </Button>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.vehicles.map((v) => (
            <span key={v.id} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-fk-text">
              {v.brand} {v.model}
            </span>
          ))}
        </div>
      </section>

      {/* ============ Sold by — Flipkart-style seller card ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-xs font-bold uppercase tracking-wide text-fk-muted">{t("product.soldBy")}</h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-fk-blue">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-fk-muted">
              <span>{t("product.soldBy")}:</span>
              <span className="truncate text-sm font-bold text-fk-text">{p.retailer.businessName}</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-fk-green">
                <BadgeCheck className="h-3 w-3" aria-hidden /> {t("product.verifiedSeller")}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-fk-muted">
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1 py-0.5 text-[10px] font-bold text-white">
                4.4 <Star className="h-2 w-2 fill-white" aria-hidden />
              </span>
              <span>{p.retailer.city}</span>
            </p>
          </div>
          <Link href={`/category/all?retailer=${p.retailer.id}`} className="flex shrink-0 items-center text-xs font-bold text-fk-blue hover:underline">
            {t("product.viewStore")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* ============ Delivery checker ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 shrink-0 text-fk-blue" aria-hidden />
          <Input
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setPinOk(false);
            }}
            placeholder={t("product.deliveryPin")}
            className="h-9 w-36 text-sm"
            aria-label={t("product.deliveryPin")}
          />
          <Button variant="ghost" className="h-9 px-3 text-xs font-bold text-fk-blue hover:bg-accent" onClick={() => setPinOk(pin.length === 6)}>
            {t("product.checkDelivery")}
          </Button>
        </div>
        {pinOk && (
          <p className="mt-2 text-[13px] font-semibold text-fk-green">{t("product.deliveryBy", { n: deliveryLabel() })}</p>
        )}
      </section>

      {/* ============ Highlights ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-sm font-bold text-fk-text">{t("product.highlights")}</h2>
        <ul className="mt-2 space-y-1.5">
          {highlights.map((k) => (
            <li key={k} className="flex items-start gap-2 text-[13px] text-fk-text">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fk-blue" aria-hidden />
              {t(k)}
            </li>
          ))}
        </ul>
      </section>

      {/* ============ Description ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-fk-text">{t("product.description")}</h2>
          <span className="text-[11px] text-fk-muted">{t("product.partNumber")}: {p.partNumber}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-fk-muted">{p.description}</p>
        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-[11px] text-fk-muted">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-fk-green" /> {t("product.verifiedSeller")}</span>
        </div>
      </section>

      {/* ============ Ratings & Reviews ============ */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-sm font-bold text-fk-text">{t("product.ratingsReviews")}</h2>
        <div className="mt-2.5 flex items-center gap-5">
          <div className="text-center">
            <p className="flex items-center gap-1 text-3xl font-bold text-fk-text">
              4.3 <Star className="h-5 w-5 fill-fk-green text-fk-green" aria-hidden />
            </p>
            <p className="text-[11px] text-fk-muted">{t("product.reviewsCount")}</p>
          </div>
          <div className="flex-1 space-y-1">
            {BARS.map((b) => (
              <div key={b.star} className="flex items-center gap-2">
                <span className="w-4 text-right text-[10px] text-fk-muted">{b.star}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fk-bg">
                  <span className="block h-full rounded-full bg-fk-green" style={{ width: `${b.pct}%` }} />
                </span>
                <span className="w-8 text-[10px] text-fk-muted">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2.5 border-t pt-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-sm border border-border/70 p-2.5">
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1 py-0.5 text-[10px] font-bold text-white">
                4.{n + 1} <Star className="h-2 w-2 fill-white" aria-hidden />
              </span>
              <p className="mt-1.5 text-[13px] leading-snug text-fk-text">{t(`product.review${n}.text`)}</p>
              <p className="mt-1 text-[11px] text-fk-muted">
                {["Rahul S.", "Priya M.", "Amit K."][n - 1]} · <span className="inline-flex items-center gap-0.5 text-fk-green"><BadgeCheck className="h-3 w-3" />{t("product.assured")}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Similar Parts ============ */}
      <section aria-label="Similar parts">
        <h2 className="mb-2.5 px-1 text-base font-bold text-fk-text">{t("product.similar")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {similar === null
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 w-40 shrink-0 rounded-md" />)
            : similar.map((sp) => (
                <div key={sp.id} className="w-40 shrink-0">
                  <ProductCard p={sp} />
                </div>
              ))}
        </div>
      </section>

      {/* ============ Sticky glass action bar — 50/50 ============ */}
      <div className="fk-glass-actionbar fixed inset-x-0 bottom-0 z-40 pb-safe">
        <div className="mx-auto grid max-w-5xl grid-cols-2">
          <button
            disabled={p.stock === 0 || adding}
            onClick={() => addToCart(false)}
            className="h-[52px] bg-fk-orange text-sm font-bold text-white transition-colors hover:bg-fk-coral disabled:opacity-60"
          >
            {added ? t("product.goToCart") : t("product.addToCart")}
          </button>
          <button
            disabled={p.stock === 0 || adding}
            onClick={() => addToCart(true)}
            className="h-[52px] bg-fk-coral text-sm font-bold text-white transition-colors hover:bg-fk-orange disabled:opacity-60"
          >
            {t("product.buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
