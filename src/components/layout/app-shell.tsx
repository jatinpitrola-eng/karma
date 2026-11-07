"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 pb-24 pt-3">{children}</main>

      <footer className="bg-footer mt-2 border-t pb-24">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-fk-text">
              <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-[#0E2148] ring-1 ring-[#C9A227]/60">
                <img src="/images/karma-medal-192.png" alt="" className="h-6 w-6 rounded-full object-cover" draggable={false} />
              </span>
              KARMA
            </span>
            <Link href="/seller/signup" className="font-semibold text-fk-blue hover:text-fk-blue-dark hover:underline">
              {t("seller.becomeSeller")}
            </Link>
            <Link href="/account" className="text-fk-muted hover:text-fk-blue hover:underline">{t("account.help")}</Link>
            <Link href="/account" className="text-fk-muted hover:text-fk-blue hover:underline">{t("account.about")}</Link>
            <span className="ml-auto text-fk-muted">© 2026 KARMA — {t("auth.sub")}</span>
          </div>
        </div>
      </footer>

      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
