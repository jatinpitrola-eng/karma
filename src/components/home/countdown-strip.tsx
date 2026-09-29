"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Countdown to 11:59 PM IST (fixed UTC+5:30, no DST) — Flipkart Deals style */
export function CountdownStrip() {
  const { t } = useI18n();
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const nowMs = Date.now();
      // current IST date parts (IST = UTC+5:30, no DST)
      const ist = new Date(nowMs + 5.5 * 3600000);
      const y = ist.getUTCFullYear(), mo = ist.getUTCMonth(), d = ist.getUTCDate();
      // end = today 23:59 IST == 18:29 UTC
      const end = Date.UTC(y, mo, d, 18, 29, 0);
      const diff = Math.max(0, end - nowMs);
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
    <span className="flex items-center gap-1 rounded-sm bg-fk-text px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums text-fk-yellow">
      {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </span>
  );
}
