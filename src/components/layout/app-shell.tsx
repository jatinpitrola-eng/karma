"use client";
import Link from "next/link";
import { Wrench } from "lucide-react";
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

      <footer className="bg-footer border-t pb-24">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-primary text-foreground">
                <Wrench className="h-3.5 w-3.5" />
              </span>
              PartKart
            </span>
            <Link href="/seller/signup" className="font-semibold text-foreground hover:text-[#F59E0B] hover:underline">
              {t("seller.becomeSeller")}
            </Link>
            <Link href="/account" className="text-foreground/80 hover:text-[#F59E0B] hover:underline">{t("account.help")}</Link>
            <Link href="/account" className="text-foreground/80 hover:text-[#F59E0B] hover:underline">{t("account.about")}</Link>
            <span className="ml-auto text-muted-foreground">© 2026 PartKart — {t("auth.sub")}</span>
          </div>
        </div>
      </footer>

      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
