"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";
import { Skeleton } from "@/components/ui/skeleton";

function SearchInner() {
  const sp = useSearchParams();
  const { t } = useI18n();
  const query = sp.get("q") ?? "";
  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">
        {t("common.search")}: <span className="text-primary">{query}</span>
      </h1>
      <CatalogView query={query} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <SearchInner />
    </Suspense>
  );
}
