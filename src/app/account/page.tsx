"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, MapPin, Store, Languages, Download, HelpCircle, Info, LogIn, LogOut, ChevronRight, User, BadgeCheck } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { useNotifications } from "@/components/notifications/notification-engine";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const { me, loading } = useSession();
  const { pushPermission, enablePush } = useNotifications();
  const [langOpen, setLangOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    useSession.getState().setMe(null);
    useSession.getState().setCartCount(0);
    router.push("/");
    setTimeout(() => window.location.reload(), 400);
  };

  if (loading) return <Skeleton className="h-72 rounded-xl" />;

  const retailerApproved = me?.retailer?.status === "APPROVED";
  const retailerPending = me?.retailer?.status === "PENDING";

  return (
    <div className="space-y-4">
      {/* profile card */}
      <div className="rounded-md bg-card p-4 shadow-fk">
        {me ? (
          <div className="flex items-center gap-3.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-fk-blue text-white">
              <User className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">{t("account.loggedInAs")}</p>
              <p className="truncate text-base font-bold">{me.name || me.phone}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-bold text-secondary-foreground">
                  {me.role === "ADMIN" ? t("account.admin") : me.role === "RETAILER" ? t("account.retailer") : t("account.customer")}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">+91 {me.phone}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <User className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t("account.notLoggedIn")}</p>
              <Button size="sm" className="mt-2 h-9 gap-1.5 font-bold" onClick={() => router.push("/auth/login?next=/account")}>
                <LogIn className="h-4 w-4" /> {t("account.loginNow")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* menu */}
      <div className="overflow-hidden rounded-md bg-card shadow-fk">
        <div className="divide-y">
          <Link href="/orders" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
            <Package className="h-5 w-5 text-fk-blue" />
            <span className="flex-1 text-sm font-medium">{t("account.myOrders")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/cart" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
            <span className="h-5 w-5 text-center text-base leading-5">🛒</span>
            <span className="flex-1 text-sm font-medium">{t("nav.cart")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Seller entry */}
          {me?.retailer ? (
            <Link href="/seller" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
              <Store className="h-5 w-5 text-fk-blue" />
              <span className="flex-1 text-sm font-medium">{t("account.sellerHub")}</span>
              {retailerApproved && <BadgeCheck className="h-4 w-4 text-green-600" />}
              {retailerPending && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">PENDING</span>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ) : (
            <Link href="/seller/signup" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
              <Store className="h-5 w-5 text-fk-blue" />
              <span className="flex-1 text-sm font-medium">{t("account.becomeSeller")}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {/* push notifications toggle */}
          {me && (
            <button
              onClick={pushPermission === "granted" ? undefined : enablePush}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-muted/60"
            >
              <span className="text-base leading-5">🔔</span>
              <span className="flex-1 text-sm font-medium">{t("notif.pushEnable")}</span>
              {pushPermission === "granted" && <BadgeCheck className="h-4 w-4 text-green-600" />}
            </button>
          )}

          {/* language */}
          <div className="relative">
            <button onClick={() => setLangOpen((v) => !v)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-muted/60">
              <Languages className="h-5 w-5 text-fk-blue" />
              <span className="flex-1 text-sm font-medium">{t("account.language")}</span>
              <span className="text-xs font-bold text-foreground">{LANGS.find((l) => l.code === lang)?.native}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            {langOpen && (
              <div className="border-t bg-muted/40 px-4 py-2.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("account.selectLanguage")}</p>
                <div className="flex gap-2">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as Lang);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold",
                        lang === l.code ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                      )}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              // triggers install prompt logic via the floating button or modal
              window.dispatchEvent(new CustomEvent("pk-install"));
            }}
            className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-muted/60"
          >
            <Download className="h-5 w-5 text-fk-blue" />
            <span className="flex-1 text-sm font-medium">{t("account.installApp")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <Link href="/account" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
            <HelpCircle className="h-5 w-5 text-fk-blue" />
            <span className="flex-1 text-sm font-medium">{t("account.help")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/account" className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60">
            <Info className="h-5 w-5 text-fk-blue" />
            <span className="flex-1 text-sm font-medium">{t("account.about")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {me && (
        <Button variant="outline" className="h-11 w-full font-bold text-red-600 hover:bg-red-50" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> {t("account.signOut")}
        </Button>
      )}

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        KARMA — {t("auth.sub")} · v2.0.0
      </p>
    </div>
  );
}
