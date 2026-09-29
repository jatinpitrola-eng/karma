"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Bike, Package, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  // Product page uses its own Flipkart-style glass action bar instead of the nav
  if (pathname.startsWith("/product/")) return null;

  const tabs = [
    { href: "/", label: t("nav.home"), icon: Home, exact: true },
    { href: "/categories", label: t("nav.categories"), icon: LayoutGrid },
    { href: "/vehicle", label: t("nav.vehicle"), icon: Bike },
    { href: "/orders", label: t("nav.orders"), icon: Package },
    { href: "/account", label: t("nav.account"), icon: User },
  ];

  return (
    <nav className="fk-glass-bottomnav fixed inset-x-0 bottom-0 z-40 pb-safe" aria-label="Primary">
      <div className="mx-auto flex max-w-5xl">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10.5px] transition-colors",
                active ? "font-bold text-fk-blue" : "font-medium text-fk-muted"
              )}
            >
              <span className={cn("relative", active && "text-fk-blue")}>
                <Icon className={cn("h-5 w-5", active && "fill-fk-blue/15 stroke-[2.2]")} />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
