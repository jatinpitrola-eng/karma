"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatINR, discountPct, parseImages } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

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
  const off = discountPct(p.price, p.mrp);
  const img = parseImages(p.images)[0];
  return (
    <Link
      href={`/product/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition-shadow hover:shadow-pop"
    >
      <div className={`relative grid aspect-square place-items-center bg-gradient-to-br ${img.g ?? "from-yellow-50 to-amber-100"}`}>
        <span className="text-5xl drop-shadow-sm transition-transform group-hover:scale-110" aria-hidden>
          {img.e ?? "🔧"}
        </span>
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-green-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {t("common.off", { n: off })}
          </span>
        )}
        {p.stock === 0 ? (
          <span className="absolute inset-0 grid place-items-center bg-black/45 text-xs font-bold uppercase tracking-wide text-white">
            {t("product.outOfStock")}
          </span>
        ) : p.stock < 5 ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {t("product.lowStock", { n: p.stock })}
          </span>
        ) : null}
        <Heart className="absolute right-2 top-2 h-4 w-4 text-white/80 drop-shadow" aria-hidden />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 min-h-[2.4em] text-[13px] font-medium leading-snug">{p.name}</p>
        <p className="text-[11px] text-muted-foreground">{p.retailer?.businessName ?? ""}</p>
        <div className="mt-auto flex items-baseline gap-1.5 pt-1">
          <span className="text-sm font-bold">{formatINR(p.price)}</span>
          {off > 0 && <span className="text-[11px] text-muted-foreground line-through">{formatINR(p.mrp)}</span>}
        </div>
        <p className="text-[10.5px] font-medium text-muted-foreground">{t("product.deliveryIn")}</p>
      </div>
    </Link>
  );
}
