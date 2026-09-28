"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const SLIDES = [
  { key: "hero1", from: "from-amber-400", to: "to-yellow-300", emoji: "⛓️" },
  { key: "hero2", from: "from-yellow-300", to: "to-amber-300", emoji: "🛢️" },
  { key: "hero3", from: "from-amber-300", to: "to-yellow-200", emoji: "🛑" },
  { key: "hero4", from: "from-amber-400", to: "to-yellow-200", emoji: "⚙️" },
];

export function HeroCarousel() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const s = SLIDES[idx];

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${s.from} ${s.to} shadow-soft`}>
      <div className="flex min-h-[132px] items-center justify-between px-5 py-5">
        <div key={s.key} className="slide-up-in">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground/60">PartKart</p>
          <h2 className="mt-0.5 text-xl font-extrabold text-foreground sm:text-2xl">{t(`home.${s.key}.title`)}</h2>
          <p className="mt-1 text-sm text-foreground/80">{t(`home.${s.key}.sub`)}</p>
          <Link
            href="/deals"
            className="mt-2.5 inline-block rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-primary shadow-sm active:scale-95"
          >
            {t(`home.${s.key}.cta`)} →
          </Link>
        </div>
        <span className="text-6xl drop-shadow-lg sm:text-7xl" aria-hidden>
          {s.emoji}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25"}`}
          />
        ))}
      </div>
    </div>
  );
}
