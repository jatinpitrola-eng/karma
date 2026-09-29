"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { PartImg } from "@/components/product/part-img";

const SLIDES = [
  { key: "banner1", img: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600&auto=format&fit=crop", from: "#2874F0", to: "#1A5CBE", dark: false },
  { key: "banner2", img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop", from: "#FB641B", to: "#FF9F00", dark: false },
  { key: "banner3", img: "https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=600", from: "#FFE11B", to: "#FFC107", dark: true },
];

export function HeroCarousel() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const s = SLIDES[idx];

  return (
    <div
      className="relative overflow-hidden rounded-md shadow-fk"
      style={{ background: `linear-gradient(100deg, ${s.from} 55%, ${s.to} 100%)` }}
    >
      <div className="flex min-h-[150px] items-center justify-between gap-2 px-4 py-4 sm:min-h-[180px] sm:px-6">
        <div key={s.key} className="slide-up-in max-w-[62%]">
          <h2
            className="text-lg font-extrabold leading-tight tracking-wide sm:text-2xl"
            style={{ color: s.dark ? "#212121" : "#FFFFFF" }}
          >
            {t(`home.${s.key}.title`)}
          </h2>
          <p className="mt-1 text-xs font-semibold sm:text-sm" style={{ color: s.dark ? "#374151" : "rgba(255,255,255,0.92)" }}>
            {t(`home.${s.key}.sub`)}
          </p>
          <Link
            href="/deals"
            className={`mt-2.5 inline-block rounded-sm px-4 py-1.5 text-xs font-bold shadow-sm active:scale-95 ${
              s.dark ? "bg-fk-text text-white" : "bg-fk-yellow text-fk-text"
            }`}
          >
            {t("common.viewAll")} →
          </Link>
        </div>
        <span className="h-[110px] w-[110px] shrink-0 overflow-hidden rounded-full ring-4 ring-white/25 sm:h-[136px] sm:w-[136px]">
          <PartImg key={s.key} src={s.img} alt={t(`home.${s.key}.title`)} eager className="h-full w-full object-cover" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx
                ? s.dark ? "w-5 bg-fk-text" : "w-5 bg-white"
                : s.dark ? "w-1.5 bg-fk-text/25" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
