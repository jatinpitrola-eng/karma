"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Star, Store } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { PartImg } from "@/components/product/part-img";
import { VehicleSelector, VehicleChipBar } from "@/components/home/vehicle-selector";
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
      {/* active vehicle chip (under header, Flipkart style) */}
      <VehicleChipBar />

      {/* 1. Category strip — real photo circles */}
      <section aria-label="Categories">
        {categories ? (
          <CategoryCircles categories={categories} />
        ) : (
          <Skeleton className="h-28 rounded-md" />
        )}
      </section>

      {/* 2. Sale banner carousel */}
      <section aria-label="Offers">
        <HeroCarousel />
      </section>

      {/* 3. Deals of the Day */}
      <section aria-label="Deals of the day">
        <div className="overflow-hidden rounded-md bg-card shadow-fk">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-fk-text">{t("home.dealsOfDay")}</span>
              <CountdownStrip />
            </div>
            <Link href="/deals" className="flex items-center text-xs font-bold text-fk-blue hover:underline">
              {t("common.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto p-3 no-scrollbar">
            {deals === null
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-60 w-40 shrink-0 rounded-md" />)
              : deals.length === 0
                ? <p className="py-8 text-sm text-fk-muted">{t("cat.noResults")}</p>
                : deals.map((p) => (
                    <div key={p.id} className="w-40 shrink-0">
                      <ProductCard p={p} />
                    </div>
                  ))}
          </div>
        </div>
      </section>

      {/* 4. Vehicle selector pill */}
      <section aria-label="Vehicle selector">
        {vehicles ? <VehicleSelector vehicles={vehicles} /> : <Skeleton className="h-[68px] rounded-md" />}
      </section>

      {/* 5. Trending Parts — 2-col grid */}
      <section aria-label="Trending parts">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-fk-text">{t("home.trending")}</h2>
          <Link href="/categories" className="flex items-center text-xs font-semibold text-fk-blue hover:underline">
            {t("common.viewAll")} <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {trending === null
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-md" />)
            : trending.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* 6. Top Retailers strip */}
      <section aria-label="Top retailers">
        <div className="mb-2.5 px-1">
          <h2 className="text-base font-bold text-fk-text">{t("home.topRetailers")}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {retailers === null
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-64 shrink-0 rounded-md" />)
            : retailers.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/category/all?retailer=${r.id}`}
                  className="flex w-64 shrink-0 overflow-hidden rounded-md bg-card shadow-fk transition-shadow hover:shadow-fk-lift"
                >
                  <span className="h-full w-20 shrink-0 overflow-hidden bg-fk-bg">
                    <PartImg
                      src={i % 2 === 0 ? "https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=600" : "https://images.unsplash.com/photo-1504222490345-c075b6008014?q=80&w=600&auto=format&fit=crop"}
                      alt={r.businessName}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1 p-3">
                    <span className="flex items-center gap-1">
                      <Store className="h-3.5 w-3.5 shrink-0 text-fk-blue" aria-hidden />
                      <span className="block truncate text-sm font-bold text-fk-text">{r.businessName}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-fk-muted">{r.city}</span>
                    <span className="mt-1 flex items-center gap-1">
                      <span className="inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1 py-0.5 text-[10px] font-bold text-white">
                        4.4 <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
                      </span>
                      <span className="text-[10.5px] text-fk-muted">{t("home.retailerOrders")}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-fk-green">
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
