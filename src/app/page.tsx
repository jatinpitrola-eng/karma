"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { VehicleSelector } from "@/components/home/vehicle-selector";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { CategoryCircles, type Cat } from "@/components/home/category-circles";
import { CountdownStrip } from "@/components/home/countdown-strip";
import { Skeleton } from "@/components/ui/skeleton";

type Vehicle = { id: string; key: string; type: string; brand: string; model: string };
type Retailer = { id: string; businessName: string; city: string; productCount: number };

export default function HomePage() {
  const { t } = useI18n();
  const vehicle = useVehicleStore((s) => s.vehicle);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [categories, setCategories] = useState<Cat[] | null>(null);
  const [retailers, setRetailers] = useState<Retailer[] | null>(null);

  const vq = vehicle ? `&vehicleId=${vehicle.id}` : "";

  // data stored together with the query key it was loaded for
  const [dealsData, setDealsData] = useState<{ key: string; items: ProductCardData[] } | null>(null);
  const [trendingData, setTrendingData] = useState<{ key: string; items: ProductCardData[] } | null>(null);

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles ?? [])).catch(() => setVehicles([]));
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => setCategories([]));
    fetch("/api/retailers").then((r) => r.json()).then((d) => setRetailers(d.retailers ?? [])).catch(() => setRetailers([]));
  }, []);

  useEffect(() => {
    fetch(`/api/products?deals=1&pageSize=12${vq}`)
      .then((r) => r.json())
      .then((d) => setDealsData({ key: vq, items: d.products ?? [] }))
      .catch(() => setDealsData({ key: vq, items: [] }));
    fetch(`/api/products?pageSize=10&sort=popular${vq}`)
      .then((r) => r.json())
      .then((d) => setTrendingData({ key: vq, items: d.products ?? [] }))
      .catch(() => setTrendingData({ key: vq, items: [] }));
  }, [vq]);

  const deals = dealsData && dealsData.key === vq ? dealsData.items : null;
  const trending = trendingData && trendingData.key === vq ? trendingData.items : null;

  return (
    <div className="space-y-4">
      {/* 1. Vehicle selector */}
      <section aria-label="Vehicle selector">
        {vehicles ? <VehicleSelector vehicles={vehicles} /> : <Skeleton className="h-[92px] rounded-xl" />}
      </section>

      {/* 2. Hero carousel */}
      <section aria-label="Offers">
        <HeroCarousel />
      </section>

      {/* 3. Category circles */}
      <section aria-label="Categories">
        {categories ? (
          <CategoryCircles categories={categories} />
        ) : (
          <Skeleton className="h-28 rounded-xl" />
        )}
      </section>

      {/* 4. Deals of the Day */}
      <section aria-label="Deals of the day">
        <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
          <CountdownStrip />
          <div className="flex gap-3 overflow-x-auto p-3 no-scrollbar">
            {deals === null
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-56 w-36 shrink-0 rounded-xl" />)
              : deals.length === 0
                ? <p className="py-8 text-sm text-muted-foreground">{t("cat.noResults")}</p>
                : deals.map((p) => (
                    <div key={p.id} className="w-36 shrink-0">
                      <ProductCard p={p} />
                    </div>
                  ))}
          </div>
        </div>
      </section>

      {/* 5. Trending Parts — 2-col grid */}
      <section aria-label="Trending parts">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-base font-bold">{t("home.trending")}</h2>
          <Link href="/categories" className="flex items-center text-xs font-semibold text-primary hover:underline">
            {t("common.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {trending === null
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)
            : trending.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* 6. Top Retailers strip */}
      <section aria-label="Top retailers">
        <div className="mb-2.5 px-1">
          <h2 className="text-base font-bold">{t("home.topRetailers")}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {retailers === null
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-56 shrink-0 rounded-xl" />)
            : retailers.map((r) => (
                <Link
                  key={r.id}
                  href={`/category/all?retailer=${r.id}`}
                  className="flex w-56 shrink-0 items-center gap-3 rounded-xl border bg-card p-3.5 shadow-soft transition-shadow hover:shadow-pop"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white">
                    <Store className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{r.businessName}</span>
                    <span className="block text-[11px] text-muted-foreground">{r.city}</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-green-700">
                      {t("home.retailerProducts", { n: r.productCount })}
                    </span>
                  </span>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
