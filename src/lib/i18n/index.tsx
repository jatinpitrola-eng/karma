"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { en, type Dict, type Lang } from "./en";
import { hi } from "./hi";
import { gu } from "./gu";

const DICTS: Record<Lang, Dict> = { en, hi, gu };
export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Dict | string, params?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    // hydrate persisted language after mount (deferred to avoid sync setState in effect)
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem("pk_lang") as Lang | null;
        if (stored && DICTS[stored]) setLangState(stored);
        document.documentElement.lang = stored && DICTS[stored] ? stored : "en";
      } catch {}
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("pk_lang", l);
      document.documentElement.lang = l;
    } catch {}
  }, []);

  const t = useCallback(
    (key: keyof Dict | string, params?: Record<string, string | number>): string => {
      const dict = DICTS[lang] ?? en;
      let s = (dict as Record<string, string>)[key as string] ?? (en as Record<string, string>)[key as string] ?? (key as string);
      if (params) {
        for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
      }
      return s;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

// Localized category name helper
export function localizedCatName(cat: { name: string; nameHi: string; nameGu: string }, lang: Lang): string {
  if (lang === "hi") return cat.nameHi || cat.name;
  if (lang === "gu") return cat.nameGu || cat.name;
  return cat.name;
}
