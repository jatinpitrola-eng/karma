"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { localizedCatName, useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";
import type { Cat } from "@/components/home/category-circles";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const { t, lang } = useI18n();
  const [categories, setCategories] = useState<Cat[] | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => setCategories([]));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="px-1 text-lg font-bold text-fk-text">{t("cat.allCategories")}</h1>

      {/* chip rail */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="shrink-0 rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-fk-text hover:border-fk-blue hover:text-fk-blue"
          >
            {localizedCatName(c, lang)}
          </Link>
        ))}
      </div>

      {/* 2-col photo grid — Flipkart listing style */}
      <div className="grid grid-cols-2 gap-3">
        {categories === null
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-md" />)
          : categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-md bg-card shadow-fk transition-shadow hover:shadow-fk-lift"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-white">
                  <img src={c.imageUrl || "/images/part-placeholder.svg"} alt={localizedCatName(c, lang)} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1 py-0.5 text-[10px] font-bold text-white">
                    4.4 <Star className="h-2 w-2 fill-white" aria-hidden />
                  </span>
                </span>
                <span className="flex items-center justify-between border-t border-border/60 p-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-fk-text">{localizedCatName(c, lang)}</span>
                    <span className="block text-[11px] text-fk-muted">{t("cat.productsIn", { n: c.count })}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-fk-blue" aria-hidden />
                </span>
              </Link>
            ))}
      </div>

      <section>
        <h2 className="mb-2.5 px-1 text-base font-bold text-fk-text">{t("home.trending")}</h2>
        <CatalogView category="all" />
      </section>
    </div>
  );
}
