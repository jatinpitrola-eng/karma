"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Package, Store, Shield, Megaphone, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useNotifications } from "./notification-engine";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { timeAgoParts } from "@/lib/format";

const typeIcon: Record<string, typeof Bell> = {
  ORDER: Package,
  RETAILER: Store,
  ADMIN: Shield,
  PROMO: Megaphone,
  INFO: Info,
};

export function NotificationBell() {
  const { t } = useI18n();
  const { notifications, unread, markAllRead, pushPermission, enablePush } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        aria-label={t("notif.title")}
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-fk-yellow px-1 text-[10px] font-bold text-fk-text live-dot">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[calc(100vw-16px)] overflow-hidden rounded-xl border bg-popover shadow-pop slide-up-in">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">{t("notif.title")}</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-bold text-foreground hover:underline">
                  <Check className="h-3.5 w-3.5" /> {t("notif.markAll")}
                </button>
              )}
            </div>

            {pushPermission === "default" && (
              <button
                onClick={enablePush}
                className="w-full border-b bg-secondary px-4 py-2.5 text-left text-xs font-medium text-secondary-foreground hover:bg-accent"
              >
                🔔 {t("notif.pushEnable")}
              </button>
            )}

            <div className="max-h-96 overflow-y-auto thin-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">{t("notif.empty")}</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcon[n.type] ?? Info;
                  const ago = timeAgoParts(n.createdAt);
                  const agoText =
                    ago.unit === "min" ? t("notif.minAgo", { n: ago.n }) :
                    ago.unit === "hr" ? t("notif.hourAgo", { n: ago.n }) :
                    t("notif.dayAgo", { n: ago.n });
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        if (n.link) router.push(n.link);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted/60",
                        !n.read && "bg-secondary/60"
                      )}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-fk-blue">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", !n.read ? "font-semibold" : "font-medium")}>{n.title}</span>
                          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary live-dot" />}
                        </span>
                        {n.body && <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">{n.body}</span>}
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">{agoText}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
