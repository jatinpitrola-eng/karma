"use client";
import { useI18n } from "@/lib/i18n";
import { CatalogView } from "@/components/product/catalog-view";

export default function DealsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div
        className="rounded-md px-4 py-4 shadow-fk"
        style={{ background: "linear-gradient(100deg, #2874F0 55%, #1A5CBE 100%)" }}
      >
        <h1 className="text-lg font-extrabold text-white">⚡ {t("home.dealsOfDay")}</h1>
        <p className="text-xs font-semibold text-fk-yellow">{t("home.hero1.sub")}</p>
      </div>
      <CatalogView deals />
    </div>
  );
}
