"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownStrip() {
  const { t } = useI18n();
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());
      setLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between rounded-t-xl border-b bg-gradient-to-r from-orange-600 to-red-500 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
          <Timer className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-white">{t("home.dealsOfDay")}</span>
      </div>
      <span className="flex items-center gap-1 text-xs font-semibold text-white">
        {t("home.endsIn")}
        <span className="rounded bg-black/25 px-1.5 py-0.5 font-mono tabular-nums">
          {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
        </span>
      </span>
    </div>
  );
}
