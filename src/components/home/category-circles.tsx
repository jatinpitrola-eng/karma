"use client";
import Link from "next/link";
import { localizedCatName, useI18n } from "@/lib/i18n";
import { PartImg } from "@/components/product/part-img";

export type Cat = { id: string; slug: string; name: string; nameHi: string; nameGu: string; icon: string; gradient: string; imageUrl?: string; count: number };

export function CategoryCircles({ categories }: { categories: Cat[] }) {
  const { lang } = useI18n();
  return (
    <div className="rounded-md bg-card p-3 shadow-fk">
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar sm:justify-between sm:gap-2">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 sm:w-auto">
            <span className="h-16 w-16 overflow-hidden rounded-full shadow-md ring-2 ring-white transition-transform active:scale-95">
              <PartImg src={c.imageUrl} alt={localizedCatName(c, lang)} className="h-full w-full object-cover" />
            </span>
            <span className="line-clamp-2 text-center text-xs leading-tight text-fk-text">
              {localizedCatName(c, lang)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
