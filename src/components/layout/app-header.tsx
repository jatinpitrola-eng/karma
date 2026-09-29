"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronDown, Globe, Zap, User, Bike, Car } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { formatINR, parseImages, PART_PLACEHOLDER } from "@/lib/format";
import { useSession } from "@/lib/store";
import { NotificationBell } from "@/components/notifications/bell";
import { PartImg } from "@/components/product/part-img";

type Suggestion = { id: string; slug: string; name: string; price: number; images: string };

const TREND_KEYS = ["search.trend1", "search.trend2", "search.trend3", "search.trend4"];

export function AppHeader() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const cartCount = useSession((s) => s.cartCount);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // live suggestions (debounced)
  const fetchSug = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSug(q), 180);
    return () => clearTimeout(timer);
  }, [q, fetchSug]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowSug(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setShowSug(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const pickSuggestion = (s: Suggestion) => {
    setShowSug(false);
    setQ("");
    router.push(`/product/${s.slug}`);
  };

  const goTrend = (chip: string) => {
    setShowSug(false);
    router.push(`/search?q=${encodeURIComponent(chip)}`);
  };

  const showTrending = showSug && q.trim().length < 2;

  return (
    <header className="fk-glass-header sticky top-0 z-40">
      <div className="mx-auto w-full max-w-5xl px-3">
        {/* Row 1 — logo + actions */}
        <div className="flex items-center gap-2.5 pt-2.5 pb-1.5">
          <Link href="/" className="flex min-w-0 shrink-0 items-baseline gap-1.5" aria-label="PartKart Home">
            <span className="text-lg font-extrabold italic tracking-tight text-white">PartKart</span>
            <span className="flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-fk-yellow sm:text-xs">
              Explore&nbsp;Parts+
              <Zap className="h-3 w-3 fill-fk-yellow text-fk-yellow" aria-hidden />
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {/* Language switcher */}
            <div className="relative shrink-0">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-white hover:bg-white/10"
                aria-label={t("account.selectLanguage")}
              >
                <Globe className="h-4 w-4" />
                <span className="uppercase">{lang}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-md border border-border bg-popover shadow-fk-lift slide-up-in">
                    {LANGS.map((l: { code: Lang; native: string }) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted ${lang === l.code ? "font-bold text-fk-blue" : "text-fk-text"}`}
                      >
                        {l.native}
                        {lang === l.code && <span className="h-2 w-2 rounded-full bg-fk-blue" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <NotificationBell />

            <Link
              href="/cart"
              aria-label={t("nav.cart")}
              className="relative grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-fk-yellow px-1 text-[9px] font-bold text-fk-text">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <Link href="/account" aria-label={t("nav.account")} className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Row 2 — solid white search */}
        <div className="pb-2.5">
          <div ref={boxRef} className="relative">
            <form onSubmit={submitSearch}>
              <div className="flex h-10 items-center rounded-[4px] bg-white px-3 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-fk-blue" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setShowSug(true);
                  }}
                  onFocus={() => setShowSug(true)}
                  placeholder={t("common.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-fk-text outline-none placeholder:text-fk-muted"
                  aria-label={t("common.search")}
                />
              </div>
            </form>

            {showSug && (showTrending || suggestions.length > 0) && (
              <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-md border border-border bg-popover shadow-fk-lift slide-up-in">
                {suggestions.length > 0 ? (
                  suggestions.map((s) => {
                    const img = parseImages(s.images)[0];
                    return (
                      <button
                        key={s.id}
                        onClick={() => pickSuggestion(s)}
                        className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-muted"
                      >
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded bg-fk-bg">
                          <PartImg src={img.url} alt={s.name} className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-fk-text">{s.name}</span>
                        <span className="shrink-0 text-sm font-bold text-fk-text">{formatINR(s.price)}</span>
                      </button>
                    );
                  })
                ) : (
                  <>
                    <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-fk-muted">{t("search.trending")}</p>
                    <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1">
                      {TREND_KEYS.map((k) => (
                        <button
                          key={k}
                          onClick={() => goTrend(t(k))}
                          className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1.5 text-xs text-fk-text hover:border-fk-blue hover:text-fk-blue"
                        >
                          <Bike className="h-3 w-3 text-fk-blue" aria-hidden />
                          {t(k)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
