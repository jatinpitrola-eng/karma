"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, ArrowLeft, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string; nameHi: string; nameGu: string };

export default function SellerSignupPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { me, loading } = useSession();

  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState({ businessName: "", ownerName: "", phone: "", city: "" });
  const [slugs, setSlugs] = useState<string[]>([]);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories ?? [])).catch(() => setCats([]));
  }, []);

  // prefill phone/name from logged-in user
  useEffect(() => {
    if (me) {
      setForm((f) => ({ ...f, phone: f.phone || me.phone, ownerName: f.ownerName || me.name || "" }));
    }
  }, [me]);

  const catLabel = (c: Cat) => (lang === "hi" ? c.nameHi : lang === "gu" ? c.nameGu : c.name);

  const sendOtp = () => {
    if (!form.businessName || !form.ownerName || !form.city || slugs.length === 0) {
      import("sonner").then(({ toast }) => toast.error(t("seller.vehiclesHint")));
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      import("sonner").then(({ toast }) => toast.error(t("auth.invalidPhone")));
      return;
    }
    setBusy(true);
    fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone }),
    })
      .then(() => {
        setStep("otp");
        import("sonner").then(({ toast }) => toast.info(t("misc.demoOtpToast"), { duration: 6000 }));
      })
      .finally(() => setBusy(false));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/retailer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categorySlugs: slugs, code: otp }),
      });
      const data = await res.json();
      if (data.ok) {
        import("sonner").then(({ toast }) => toast.success(t("seller.submitted")));
        await useSession.getState().refresh();
        router.replace("/seller");
      } else {
        import("sonner").then(({ toast }) => toast.error(data.error === "INVALID_OTP" ? t("auth.invalidOtp") : t("common.error")));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </button>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-pop">
            <Store className="h-7 w-7 text-white" />
          </span>
          <h1 className="mt-3 text-lg font-extrabold">{t("seller.becomeSeller")}</h1>
          <p className="text-xs text-muted-foreground">{t("seller.becomeSub")}</p>
        </div>

        <div className="mt-5 space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="biz">{t("seller.businessName")}</Label>
            <Input id="biz" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="owner">{t("seller.ownerName")}</Label>
              <Input id="owner" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">{t("seller.city")}</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sphone">{t("seller.phone")}</Label>
            <div className="flex items-center overflow-hidden rounded-xl border focus-within:ring-2 focus-within:ring-ring">
              <span className="border-r bg-muted px-3 py-2.5 text-sm font-semibold text-muted-foreground">+91</span>
              <Input
                id="sphone"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                className="h-11 flex-1 border-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("seller.categoryTypes")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {cats.map((c) => (
                <label key={c.slug} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs font-medium", slugs.includes(c.slug) && "border-primary bg-secondary")}>
                  <Checkbox
                    checked={slugs.includes(c.slug)}
                    onCheckedChange={(v) => setSlugs((prev) => (v ? [...prev, c.slug] : prev.filter((s) => s !== c.slug)))}
                  />
                  {catLabel(c)}
                </label>
              ))}
            </div>
          </div>

          {step === "form" ? (
            <Button className="h-11 w-full font-bold" disabled={busy} onClick={sendOtp}>
              {t("auth.sendOtp")}
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border bg-muted/40 p-3.5">
              <p className="text-xs text-muted-foreground">{t("auth.otpSent", { phone: form.phone })}</p>
              <p className="rounded-lg bg-secondary px-3 py-2 text-center text-[11px] font-medium text-secondary-foreground">{t("auth.demoOtp")}</p>
              <Input
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="h-12 text-center font-mono text-xl tracking-[0.5em]"
              />
              <Button className="h-11 w-full font-bold" disabled={busy || otp.length < 4} onClick={submit}>
                <ShieldCheck className="mr-2 h-4 w-4" /> {t("seller.submit")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
