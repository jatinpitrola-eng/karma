"use client";
import { useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";

export default function DealsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-3.5 shadow-soft">
        <h1 className="text-lg font-extrabold text-foreground">{t("home.dealsOfDay")}</h1>
        <p className="text-xs text-foreground/75">{t("home.hero1.sub")}</p>
      </div>
      <CatalogView deals />
    </div>
  );
}
