"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { VehicleChipBar } from "@/components/home/vehicle-selector";
import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

export type RetailerOption = { id: string; businessName: string };

export function CatalogView({
  category,
  deals = false,
  fixedRetailer,
  query,
}: {
  category?: string;
  deals?: boolean;
  fixedRetailer?: string;
  query?: string;
}) {
  const { t } = useI18n();
  const vehicle = useVehicleStore((s) => s.vehicle);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [retailerId, setRetailerId] = useState<string>(fixedRetailer ?? "all");
  const [sort, setSort] = useState(deals ? "discount" : "popular");
  const [retailers, setRetailers] = useState<RetailerOption[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // fetch retailer options once
  useEffect(() => {
    if (fixedRetailer) return;
    fetch("/api/retailers")
      .then((r) => r.json())
      .then((d) => setRetailers(d.retailers ?? []))
      .catch(() => setRetailers([]));
  }, [fixedRetailer]);

  const buildUrl = useCallback(
    (page = 1) => {
      const sp = new URLSearchParams();
      if (category && category !== "all") sp.set("category", category);
      if (deals) sp.set("deals", "1");
      if (query) sp.set("q", query);
      if (fixedRetailer) sp.set("retailerId", fixedRetailer);
      else if (retailerId !== "all") sp.set("retailerId", retailerId);
      if (vehicle) sp.set("vehicleId", vehicle.id);
      if (minPrice) sp.set("min", minPrice);
      if (maxPrice) sp.set("max", maxPrice);
      if (inStock) sp.set("inStock", "1");
      sp.set("sort", sort);
      sp.set("page", String(page));
      sp.set("pageSize", "24");
      return `/api/products?${sp.toString()}`;
    },
    [category, deals, fixedRetailer, retailerId, vehicle, minPrice, maxPrice, inStock, sort, query]
  );

  // current filter key — data is only shown if it was loaded for this key
  const currentKey = buildUrl();
  const [loaded, setLoaded] = useState<{ key: string; products: ProductCardData[]; total: number } | null>(null);

  const load = useCallback(() => {
    const url = buildUrl();
    fetch(url)
      .then((r) => r.json())
      .then((d) => setLoaded({ key: url, products: d.products ?? [], total: d.total ?? 0 }))
      .catch(() => setLoaded({ key: url, products: [], total: 0 }));
  }, [buildUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const products = loaded && loaded.key === currentKey ? loaded.products : null;
  const total = loaded && loaded.key === currentKey ? loaded.total : 0;

  const activeFilterCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (inStock ? 1 : 0) + (retailerId !== "all" && !fixedRetailer ? 1 : 0);

  const FiltersBody = (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("cat.priceRange")}</p>
        <div className="flex items-center gap-2">
          <Input inputMode="numeric" placeholder={t("cat.min")} value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))} />
          <span className="text-muted-foreground">—</span>
          <Input inputMode="numeric" placeholder={t("cat.max")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Checkbox id="instock" checked={inStock} onCheckedChange={(v) => setInStock(!!v)} />
        <label htmlFor="instock" className="text-sm font-medium">{t("cat.inStockOnly")}</label>
      </div>
      {!fixedRetailer && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("cat.retailer")}</p>
          <Select value={retailerId} onValueChange={setRetailerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("cat.allRetailers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cat.allRetailers")}</SelectItem>
              {retailers.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.businessName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            load();
            setSheetOpen(false);
          }}
        >
          {t("cat.applyFilters")}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setMinPrice("");
            setMaxPrice("");
            setInStock(false);
            setRetailerId("all");
          }}
        >
          {t("cat.clearFilters")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* active vehicle chip */}
      <VehicleChipBar />

      {/* toolbar: sort + filter */}
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs text-muted-foreground">{products ? t("cat.productsIn", { n: total }) : ""}</p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[150px] text-xs" aria-label={t("cat.sortBy")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">{t("cat.sort.popular")}</SelectItem>
            <SelectItem value="priceLow">{t("cat.sort.priceLow")}</SelectItem>
            <SelectItem value="priceHigh">{t("cat.sort.priceHigh")}</SelectItem>
            <SelectItem value="discount">{t("cat.sort.discount")}</SelectItem>
          </SelectContent>
        </Select>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t("cat.filters")}
              {activeFilterCount > 0 && (
                <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl px-5 pb-8">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle className="text-left">{t("cat.filters")}</SheetTitle>
            </SheetHeader>
            {FiltersBody}
          </SheetContent>
        </Sheet>
      </div>

      {/* grid */}
      {products === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="grid place-items-center rounded-md bg-card py-16 text-center">
          <SearchX className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold">{t("cat.noResults")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("cat.noResultsSub")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
