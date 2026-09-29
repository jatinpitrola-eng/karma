"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR, parseImages } from "@/lib/format";
import { localizedCatName } from "@/lib/i18n";
import { SellerGate, SellerNav } from "../seller-ui";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

type RProduct = {
  id: string;
  name: string;
  partNumber: string;
  price: number;
  mrp: number;
  stock: number;
  images: string;
  active: boolean;
  category: { slug: string; name: string; nameHi: string; nameGu: string };
  vehicles: { id: string; brand: string; model: string }[];
};

export default function SellerProductsPage() {
  const { t, lang } = useI18n();
  const [products, setProducts] = useState<RProduct[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/retailer/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(load, [load]);

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/retailer/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setProducts((prev) => (prev ?? []).map((p) => (p.id === id ? { ...p, active } : p)));
  };

  return (
    <SellerGate>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{t("seller.myProducts")}</h1>
          <Button size="sm" className="h-9 gap-1.5 font-bold" onClick={() => (window.location.href = "/seller/products/new")}>
            <Plus className="h-4 w-4" /> {t("seller.addProduct")}
          </Button>
        </div>

        <SellerNav />

        {products === null ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : products.length === 0 ? (
          <div className="rounded-md bg-card py-14 text-center">
            <p className="text-sm font-semibold">{t("seller.noProducts")}</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/seller/products/new")}>{t("seller.addProduct")}</Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.map((p) => {
              const img = parseImages(p.images)[0];
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-md bg-card p-3 shadow-fk">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-2xl ${img.g}`}>
                    {img.e ?? "🔧"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {localizedCatName(p.category, lang)} · {p.partNumber}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      <span className="font-bold">{formatINR(p.price)}</span>
                      <span className={p.stock < 5 ? "font-bold text-red-600" : "text-muted-foreground"}>
                        {t("admin.stock")}: {p.stock}
                      </span>
                      <span className={p.active ? "font-bold text-green-700" : "font-bold text-muted-foreground"}>
                        {p.active ? t("seller.liveBadge") : t("seller.disabledBadge")}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Switch checked={p.active} onCheckedChange={(v) => toggleActive(p.id, v)} aria-label={t("common.enable")} />
                    <Link href={`/seller/products/new?edit=${p.id}`} className="flex items-center gap-1 text-xs font-semibold text-foreground hover:underline">
                      <Pencil className="h-3 w-3" /> {t("common.edit")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SellerGate>
  );
}
