"use client";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, Banknote, Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SellerGate, SellerNav, StatCard, useSellerStats } from "./seller-ui";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerDashboardPage() {
  const { t } = useI18n();
  const { stats } = useSellerStats();

  return (
    <SellerGate>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent shadow-fk">
            <span className="text-lg">🏪</span>
          </span>
          <div>
            <h1 className="text-lg font-bold">{t("seller.hub")}</h1>
            <p className="text-xs text-muted-foreground">{t("seller.dashboard")}</p>
          </div>
        </div>

        <SellerNav />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats === null ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <StatCard label={t("seller.totalProducts")} value={String(stats.totalProducts)} icon={Package} />
              <StatCard label={t("seller.totalOrders")} value={String(stats.totalOrders)} icon={ShoppingCart} />
              <StatCard label={t("seller.revenue")} value={new Intl.NumberFormat("en-IN").format(stats.revenue)} icon={Banknote} />
              <StatCard label={t("seller.pendingOrders")} value={String(stats.pendingOrders)} icon={Timer} warn={stats.pendingOrders > 0} />
            </>
          )}
        </div>

        <div className="rounded-md bg-card p-4 shadow-fk">
          <h2 className="text-sm font-bold">{t("seller.dashboard")}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {t("seller.productSaved")} — {t("seller.liveBadge")} · {t("product.verifiedSeller")}
          </p>
        </div>
      </div>
    </SellerGate>
  );
}
