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
    <div className="flex items-center justify-between rounded-t-xl border-b border-amber-200/70 bg-primary px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground/10">
          <Timer className="h-3.5 w-3.5 text-foreground" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-foreground">{t("home.dealsOfDay")}</span>
      </div>
      <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
        {t("home.endsIn")}
        <span className="rounded bg-foreground px-1.5 py-0.5 font-mono tabular-nums text-primary">
          {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
        </span>
      </span>
    </div>
  );
}
