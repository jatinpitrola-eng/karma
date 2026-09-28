"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Wrench, ChevronDown, Globe } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { formatINR, parseImages } from "@/lib/format";
import { NotificationBell } from "@/components/notifications/bell";

type Suggestion = { id: string; slug: string; name: string; price: number; images: string };

export function AppHeader() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
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

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-soft">
      <div className="mx-auto w-full max-w-5xl px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label="PartKart Home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <Wrench className="h-5 w-5 text-white" />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight text-white sm:block">
              Part<span className="text-yellow-300">Kart</span>
            </span>
          </Link>

          {/* Search with live suggestions */}
          <div ref={boxRef} className="relative min-w-0 flex-1">
            <form onSubmit={submitSearch}>
              <div className="flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setShowSug(true);
                  }}
                  onFocus={() => setShowSug(true)}
                  placeholder={t("common.searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
                  aria-label={t("common.search")}
                />
              </div>
            </form>

            {showSug && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border bg-popover shadow-pop slide-up-in">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSuggestion(s)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-base ${parseImages(s.images)[0].g}`}>
                      {parseImages(s.images)[0].e ?? "🔧"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-primary">{formatINR(s.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language switcher */}
          <div className="relative shrink-0">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex h-9 items-center gap-1 rounded-full bg-white/15 px-2.5 text-xs font-semibold text-white hover:bg-white/25"
              aria-label={t("account.selectLanguage")}
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border bg-popover shadow-pop slide-up-in">
                  {LANGS.map((l: { code: Lang; native: string }) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted ${lang === l.code ? "font-bold text-primary" : ""}`}
                    >
                      {l.native}
                      {lang === l.code && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
