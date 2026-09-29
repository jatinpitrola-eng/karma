"use client";
import { useEffect } from "react";
import { hydrateVehicle, useSession } from "@/lib/store";
import { I18nProvider } from "@/lib/i18n";
import { NotificationEngine } from "@/components/notifications/notification-engine";
import { Toaster } from "sonner";

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const refresh = useSession((s) => s.refresh);
  useEffect(() => {
    hydrateVehicle();
    refresh();
    // register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [refresh]);
  return <>{children}</>;
}

function OfflineWatcher({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const onOffline = () => {
      import("sonner").then(({ toast }) => toast.error("You are offline", { description: "The app shell is cached and will keep working." }));
    };
    const onOnline = () => {
      import("sonner").then(({ toast }) => toast.success("Back online"));
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SessionBootstrap>
        <NotificationEngine>
          <OfflineWatcher>{children}</OfflineWatcher>
        </NotificationEngine>
        <Toaster position="top-center" closeButton />
      </SessionBootstrap>
    </I18nProvider>
  );
}
