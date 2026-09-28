"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench, ArrowLeft, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function LoginInner() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (useSession.getState().me) router.replace(next);
  }, [router, next]);

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      import("sonner").then(({ toast }) => toast.error(t("auth.invalidPhone")));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        setStep("otp");
        import("sonner").then(({ toast }) => toast.info(t("misc.demoOtpToast"), { description: t("auth.otpSent", { phone }), duration: 6000 }));
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (data.ok) {
        // fetch full session (user + retailer context) before redirecting
        await useSession.getState().refresh();
        import("sonner").then(({ toast }) => toast.success(t("auth.loginSuccess")));
        router.replace(next);
      } else {
        import("sonner").then(({ toast }) => toast.error(t("auth.invalidOtp")));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-pop">
            <Wrench className="h-8 w-8 text-white" />
          </span>
          <h1 className="mt-3 text-lg font-extrabold">{t("auth.welcome")}</h1>
          <p className="text-xs text-muted-foreground">{t("auth.sub")}</p>
        </div>

        {step === "phone" ? (
          <div className="mt-6 space-y-3.5">
            <label className="block text-xs font-semibold text-muted-foreground" htmlFor="phone">
              {t("auth.phoneLabel")}
            </label>
            <div className="flex items-center overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring">
              <span className="border-r bg-muted px-3 py-2.5 text-sm font-semibold text-muted-foreground">+91</span>
              <Input
                id="phone"
                inputMode="numeric"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={t("auth.phonePlaceholder")}
                className="h-11 flex-1 border-0 focus-visible:ring-0"
              />
            </div>
            <Button className="h-11 w-full font-bold" disabled={busy} onClick={sendOtp}>
              {t("auth.sendOtp")}
            </Button>
            <p className="rounded-lg bg-secondary px-3 py-2 text-center text-[11px] font-medium text-secondary-foreground">
              {t("auth.demoOtp")}
            </p>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{t("auth.terms")}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3.5">
            <button onClick={() => setStep("phone")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.changeNumber")}
            </button>
            <p className="text-xs text-muted-foreground">{t("auth.otpSent", { phone })}</p>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground" htmlFor="otp">
              <KeyRound className="h-3.5 w-3.5" /> {t("auth.otpLabel")}
            </label>
            <Input
              id="otp"
              inputMode="numeric"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="h-12 text-center font-mono text-xl tracking-[0.5em]"
            />
            <p className="rounded-lg bg-secondary px-3 py-2 text-center text-[11px] font-medium text-secondary-foreground">
              {t("auth.demoOtp")}
            </p>
            <Button className="h-11 w-full font-bold" disabled={busy || otp.length < 4} onClick={verify}>
              {t("auth.verifyOtp")}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.resellerNote")}</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-sm rounded-2xl" />}>
      <LoginInner />
    </Suspense>
  );
}
