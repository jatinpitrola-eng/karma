"use client";
import { useEffect, useState } from "react";
import { localizedCatName, useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";
import type { Cat } from "@/components/home/category-circles";
import { CategoryCircles } from "@/components/home/category-circles";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Cat[] | null>(null);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => setCategories([]));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="px-1 text-lg font-bold">{t("cat.allCategories")}</h1>
      {categories ? (
        <CategoryCircles categories={categories} />
      ) : (
        <Skeleton className="h-28 rounded-xl" />
      )}
      <section>
        <h2 className="mb-2.5 px-1 text-base font-bold">{t("home.trending")}</h2>
        <CatalogView category="all" />
      </section>
    </div>
  );
}
