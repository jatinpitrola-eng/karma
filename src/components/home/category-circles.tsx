"use client";
import Link from "next/link";
import { Link2, Cog, CircleDot, Disc3, Disc, Filter, Zap, CarFront } from "lucide-react";
import { localizedCatName, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Link2> = {
  link: Link2,
  cog: Cog,
  "circle-dot": CircleDot,
  "disc-3": Disc3,
  disc: Disc,
  filter: Filter,
  zap: Zap,
  "car-front": CarFront,
};

export type Cat = { id: string; slug: string; name: string; nameHi: string; nameGu: string; icon: string; gradient: string; count: number };

export function CategoryCircles({ categories }: { categories: Cat[] }) {
  const { lang } = useI18n();
  return (
    <div className="rounded-xl border bg-card p-3 shadow-soft">
      <div className="grid grid-cols-4 gap-y-3 sm:grid-cols-8">
        {categories.map((c) => {
          const Icon = ICONS[c.icon] ?? Cog;
          return (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br text-white shadow-sm transition-transform active:scale-95",
                  c.gradient
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="line-clamp-2 text-center text-[10.5px] font-medium leading-tight">
                {localizedCatName(c, lang)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
