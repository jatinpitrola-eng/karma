"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { localizedCatName, useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";
import { Skeleton } from "@/components/ui/skeleton";

type Cat = { slug: string; name: string; nameHi: string; nameGu: string };

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<Cat | null>(null);

  useEffect(() => {
    if (slug === "all") return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.categories ?? []).find((c: Cat) => c.slug === slug);
        setCat(found ?? null);
      })
      .catch(() => setCat(null));
  }, [slug]);

  const title = slug === "all" ? t("vehicle.all") : cat ? localizedCatName(cat, lang) : <Skeleton className="h-6 w-40" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/categories" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted" aria-label={t("common.back")}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <CatalogView category={slug} />
    </div>
  );
}
