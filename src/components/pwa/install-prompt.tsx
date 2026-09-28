"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Download, X, Share2, MoreVertical, Chrome } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const { t } = useI18n();
  const [bipEvent, setBipEvent] = useState<BIPEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const installTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // deferred init (avoids sync setState in effect)
    queueMicrotask(() => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
      setIsInApp(/fbav|fban|instagram|line\/|snapchat|whatsapp|twitter|micromessenger|otti|gsa/.test(ua));

      if (!standalone) {
        const timer = setTimeout(() => setShowButton(true), 3000);
        installTimer.current = timer;
      }
    });

    const onBip = (e: Event) => {
      e.preventDefault();
      setBipEvent(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    // Account tab "Install App" opens the modal directly
    const onManual = () => {
      setShowModal(true);
      setShowButton(false);
    };
    window.addEventListener("pk-install", onManual);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("pk-install", onManual);
      if (installTimer.current) clearTimeout(installTimer.current);
    };
  }, []);

  const onInstallClick = useCallback(async () => {
    if (bipEvent) {
      await bipEvent.prompt();
      setBipEvent(null);
      setShowButton(false);
    } else {
      setShowModal(true);
      setShowButton(false);
    }
  }, [bipEvent]);

  if (isStandalone) return null;

  return (
    <>
      {/* Floating install button */}
      {showButton && (
        <button
          onClick={onInstallClick}
          className="fixed bottom-24 right-3 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-pop slide-up-in"
        >
          <Download className="h-4 w-4" />
          {t("pwa.install")}
        </button>
      )}

      {/* Fallback modal with device-aware steps */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 sm:place-items-center" onClick={() => setShowModal(false)}>
          <div
            className="w-full rounded-t-2xl bg-card p-5 pb-8 shadow-pop sm:max-w-sm sm:rounded-2xl sm:pb-5 slide-up-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">{t("pwa.installTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("pwa.installBody")}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInApp ? (
              <div className="rounded-xl bg-secondary p-4">
                <div className="flex items-center gap-2 font-semibold text-secondary-foreground">
                  <Chrome className="h-4 w-4" /> {t("pwa.inAppTitle")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t("pwa.inAppBody")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href).then(() => setShowModal(false));
                  }}
                >
                  {t("pwa.copy")}
                </Button>
              </div>
            ) : isIOS ? (
              <div className="rounded-xl bg-secondary p-4">
                <p className="font-semibold text-secondary-foreground">{t("pwa.iosTitle")}</p>
                <ol className="mt-3 space-y-2.5 text-sm text-foreground">
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    {t("pwa.ios1")}
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    <span className="flex items-center gap-1">
                      {t("pwa.ios2")} <Share2 className="h-4 w-4 text-primary" />
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    {t("pwa.ios3")}
                  </li>
                </ol>
              </div>
            ) : (
              <div className="rounded-xl bg-secondary p-4">
                <p className="font-semibold text-secondary-foreground">{t("pwa.androidTitle")}</p>
                <ol className="mt-3 space-y-2.5 text-sm text-foreground">
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                    <span className="flex items-center gap-1">
                      {t("pwa.android1")} <MoreVertical className="h-4 w-4 text-primary" />
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                    {t("pwa.android2")}
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                    {t("pwa.android3")}
                  </li>
                </ol>
              </div>
            )}

            <Button variant="ghost" className="mt-3 w-full" onClick={() => setShowModal(false)}>
              {t("pwa.later")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
