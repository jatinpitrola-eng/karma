"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";

export type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string;
  read: boolean;
  createdAt: string;
};

type NotifCtx = {
  notifications: Notif[];
  unread: number;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  pushPermission: "default" | "granted" | "denied" | "unsupported";
  enablePush: () => Promise<void>;
};

const Ctx = createContext<NotifCtx>({
  notifications: [],
  unread: 0,
  refresh: async () => {},
  markAllRead: async () => {},
  pushPermission: "unsupported",
  enablePush: async () => {},
});

export function useNotifications() {
  return useContext(Ctx);
}

export function NotificationEngine({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushPermission, setPushPermission] = useState<"default" | "granted" | "denied" | "unsupported">("unsupported");
  const seenIds = useRef<Set<string> | null>(null);
  const { me } = useSession();
  const { t } = useI18n();

  const showBrowserPush = useCallback(async (title: string, body: string, url: string) => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: { url },
        });
      } else {
        new Notification(title, { body, icon: "/icons/icon-192.png" });
      }
    } catch {}
  }, []);

  const poll = useCallback(async () => {
    if (!me) {
      setNotifications([]);
      setUnread(0);
      seenIds.current = null;
      return;
    }
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      const list: Notif[] = data.notifications ?? [];
      setUnread(data.unread ?? 0);
      setNotifications(list);

      // first load → mark all as seen (no toast burst)
      if (seenIds.current === null) {
        seenIds.current = new Set(list.map((n) => n.id));
        setPushPermission(
          typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
        );
        return;
      }
      // toast + browser push for NEW arrivals
      for (const n of list) {
        if (!seenIds.current.has(n.id)) {
          seenIds.current.add(n.id);
          import("sonner").then(({ toast }) => {
            toast(n.title, {
              description: n.body,
              duration: 5000,
              action: n.link
                ? { label: "View", onClick: () => (window.location.href = n.link) }
                : undefined,
            });
          });
          showBrowserPush(n.title, n.body, n.link || "/");
        }
      }
    } catch {}
  }, [me, showBrowserPush]);

  // poll every 4s — feels instant
  useEffect(() => {
    poll();
    const timer = setInterval(poll, 4000);
    return () => clearInterval(timer);
  }, [poll]);

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }, []);

  const enablePush = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) {
          reg.showNotification("KARMA", {
            body: t("notif.pushEnabled"),
            icon: "/icons/icon-192.png",
          });
        }
        import("sonner").then(({ toast }) => toast.success(t("notif.pushEnabled")));
      }
    } catch {}
  }, [t]);

  return (
    <Ctx.Provider value={{ notifications, unread, refresh: poll, markAllRead, pushPermission, enablePush }}>
      {children}
    </Ctx.Provider>
  );
}
