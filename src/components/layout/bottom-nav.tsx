"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, BadgePercent, ShoppingCart, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const cartCount = useSession((s) => s.cartCount);

  const tabs = [
    { href: "/", label: t("nav.home"), icon: Home, exact: true },
    { href: "/categories", label: t("nav.categories"), icon: LayoutGrid },
    { href: "/deals", label: t("nav.deals"), icon: BadgePercent },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart, badge: cartCount },
    { href: "/account", label: t("nav.account"), icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white pb-safe" aria-label="Primary">
      <div className="mx-auto flex max-w-5xl">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10.5px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className={cn("relative", active && "text-primary")}>
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 py-0 text-[9px] font-bold text-foreground">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </span>
              {tab.label}
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
