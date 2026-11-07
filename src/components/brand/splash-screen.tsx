"use client";
import { useEffect, useState } from "react";

/**
 * KARMA app-open splash — bronze medallion + gold ring loader.
 * Shows on every full app open (root layout never remounts on client-side
 * navigation, so it plays once per load and never on route changes).
 */
export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fadeAt = reduced ? 500 : 1700;
    const removeAt = fadeAt + 500;
    const t1 = setTimeout(() => setFading(true), fadeAt);
    const t2 = setTimeout(() => setGone(true), removeAt);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden={fading || undefined}
      className={`karma-splash fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* medallion + rotating gear rings */}
      <div className="relative grid h-44 w-44 place-items-center sm:h-52 sm:w-52">
        <span className="karma-ring absolute inset-0 rounded-full" />
        <span className="karma-ring-rev absolute inset-3 rounded-full" />
        <img
          src="/images/karma-medal.png"
          alt=""
          className="karma-medal h-32 w-32 rounded-full object-cover sm:h-40 sm:w-40"
          draggable={false}
        />
      </div>

      <h1 className="karma-rise mt-6 bg-gradient-to-b from-[#F4D774] via-[#E8C860] to-[#B8860B] bg-clip-text text-4xl font-black tracking-[0.35em] text-transparent sm:text-5xl">
        KARMA
      </h1>
      <p className="karma-rise karma-rise-late mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55 sm:text-[11px]">
        Action · Work · Duty
      </p>

      {/* gold loading shimmer */}
      <div className="karma-rise karma-rise-late mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10 sm:w-52">
        <span className="karma-bar block h-full w-1/3 rounded-full bg-gradient-to-r from-[#B8860B] via-[#F4D774] to-[#B8860B]" />
      </div>
    </div>
  );
}
