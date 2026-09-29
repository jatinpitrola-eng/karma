"use client";
import Link from "next/link";
import { Heart, Star, BadgeCheck } from "lucide-react";
import { formatINR, discountPct, parseImages } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { PartImg } from "@/components/product/part-img";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  images: string;
  retailer?: { businessName: string } | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { t } = useI18n();
  const vehicle = useVehicleStore((s) => s.vehicle);
  const off = discountPct(p.price, p.mrp);
  const img = parseImages(p.images)[0];
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-md bg-card shadow-fk transition-shadow hover:shadow-fk-lift active:scale-[0.99]"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-2">
        <PartImg src={img.url} alt={p.name} className="h-full w-full rounded object-cover" />
        {off > 0 && (
          <span className="absolute left-0 top-2 rounded-r-sm bg-fk-yellow px-1.5 py-0.5 text-[11px] font-bold text-fk-text">
            {t("common.off", { n: off })}
          </span>
        )}
        {p.stock === 0 ? (
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-bold uppercase tracking-wide text-white">
            {t("product.outOfStock")}
          </span>
        ) : p.stock < 5 ? (
          <span className="absolute bottom-2 left-2 rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {t("product.lowStock", { n: p.stock })}
          </span>
        ) : null}
        <Heart className="absolute right-2 top-2 h-4 w-4 text-fk-muted drop-shadow" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-border/60 p-2.5">
        <p className="line-clamp-2 min-h-[2.4em] text-sm font-medium leading-snug text-fk-text">{p.name}</p>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-fk-green px-1 py-0.5 text-[11px] font-bold text-white">
            4.3 <Star className="h-2.5 w-2.5 fill-white" aria-hidden />
          </span>
          <span className="text-[11px] text-fk-muted">(128)</span>
        </span>
        <div className="mt-auto flex flex-wrap items-baseline gap-1.5 pt-0.5">
          <span className="text-base font-bold text-fk-text">{formatINR(p.price)}</span>
          {off > 0 && (
            <>
              <span className="text-xs text-fk-muted line-through">{formatINR(p.mrp)}</span>
              <span className="text-[13px] font-bold text-fk-green">{t("common.off", { n: off })}</span>
            </>
          )}
        </div>
        {p.retailer?.businessName && (
          <span className="flex items-center gap-1 text-xs text-fk-muted">
            <span aria-hidden>🛍</span>
            <span className="truncate">{p.retailer.businessName}</span>
          </span>
        )}
        <span className="flex items-center gap-1 text-[10.5px] font-semibold text-fk-muted">
          <BadgeCheck className="h-3 w-3 text-fk-blue" aria-hidden /> {t("product.assured")}
        </span>
        {vehicle && (
          <span className="mt-0.5 text-[11px] font-bold text-fk-green">
            ✓ {t("product.fitsVehicle", { n: `${vehicle.brand} ${vehicle.model}` })}
          </span>
        )}
      </div>
    </Link>
  );
}
