"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Plus, Banknote, Smartphone, CheckCircle2, Loader2, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatINR } from "@/lib/format";
import { useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Address = { id: string; name: string; phone: string; pincode: string; line: string; city: string; state: string; isDefault: boolean };
type CartData = { items: { product: { id: string; name: string; price: number; images: string } }[]; itemsTotal: number; deliveryFee: number } | null;

function UpiFlow({
  open,
  amount,
  onClose,
  onPaid,
}: {
  open: boolean;
  amount: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { t } = useI18n();
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [vpa, setVpa] = useState("");

  const pay = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(onPaid, 1400);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && step !== "processing" && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("checkout.upiTitle")}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{t("checkout.demoUpi")}</DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center rounded-xl bg-secondary py-6">
              <span className="text-4xl" aria-hidden>📱</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vpa">{t("checkout.upiVpa")}</Label>
              <Input id="vpa" value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder={t("checkout.upiVpaPlaceholder")} />
            </div>
            <Button className="h-11 w-full font-bold" onClick={pay}>
              {t("checkout.upiPay", { amount: formatINR(amount) })}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">{t("checkout.demoUpi")}</p>
          </div>
        )}

        {step === "processing" && (
          <div className="grid place-items-center py-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-fk-blue" />
            <p className="mt-4 text-sm font-medium">{t("checkout.upiProcessing")}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t("checkout.demoUpi")}</p>
          </div>
        )}

        {step === "success" && (
          <div className="grid place-items-center py-8 text-center">
            <span className="tick-in grid h-20 w-20 place-items-center rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </span>
            <p className="mt-4 text-base font-bold text-green-700">{t("checkout.upiSuccess")}</p>
            <p className="text-sm text-muted-foreground">{formatINR(amount)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutInner() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const me = useSession((s) => s.me);
  const refresh = useSession((s) => s.refresh);

  const [cart, setCart] = useState<CartData>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", pincode: "", line: "", city: "", state: "", save: true });
  const [payment, setPayment] = useState<"COD" | "UPI">("COD");
  const [upiOpen, setUpiOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; code: string } | null>(null);

  const coupon = sp.get("coupon") === "DEMO10" ? "DEMO10" : null;

  const loadAll = useCallback(async () => {
    const [cartRes, addrRes] = await Promise.all([
      fetch("/api/cart", { cache: "no-store" }),
      fetch("/api/addresses", { cache: "no-store" }),
    ]);
    const cartData = await cartRes.json();
    setCart(cartData);
    const addrData = await addrRes.json();
    setAddresses(addrData.addresses ?? []);
    const def = (addrData.addresses ?? [])[0];
    if (def) setSelected(def.id);
  }, []);

  useEffect(() => {
    if (me) loadAll();
  }, [me, loadAll]);

  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.pincode || !form.line || !form.city) {
      import("sonner").then(({ toast }) => toast.error(t("checkout.addressRequired")));
      return;
    }
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.ok) {
      setAddresses((prev) => [data.address, ...prev]);
      setSelected(data.address.id);
      setShowForm(false);
    }
  };

  const discount = coupon ? Math.round((cart?.itemsTotal ?? 0) * 0.1) : 0;
  const total = (cart?.itemsTotal ?? 0) + (cart?.deliveryFee ?? 0) - discount;

  const placeOrder = async () => {
    if (!selected && !addresses.length) {
      import("sonner").then(({ toast }) => toast.error(t("checkout.addressRequired")));
      return;
    }
    if (payment === "UPI") {
      setUpiOpen(true);
      return;
    }
    doPlace("COD");
  };

  const doPlace = async (method: "COD" | "UPI") => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selected, paymentMethod: method, couponCode: coupon }),
      });
      const data = await res.json();
      if (data.ok) {
        setPlaced({ id: data.orderId, code: data.code });
        refresh();
      } else {
        import("sonner").then(({ toast }) => toast.error(t("common.error")));
      }
    } finally {
      setPlacing(false);
      setUpiOpen(false);
    }
  };

  if (placed) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center">
        <span className="tick-in grid h-20 w-20 place-items-center rounded-full bg-green-100">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </span>
        <p className="mt-4 text-base font-bold text-green-700">{t("checkout.orderPlaced")}</p>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{placed.code}</p>
        <div className="mt-5 flex gap-2.5">
          <Button variant="outline" onClick={() => router.push("/")}>{t("checkout.continueShopping")}</Button>
          <Button onClick={() => router.push(`/orders/${placed.id}`)}>{t("checkout.viewOrder")}</Button>
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center">
        <p className="text-sm font-semibold">{t("checkout.loginRequired")}</p>
        <Button className="mt-4" onClick={() => router.push("/auth/login?next=/checkout")}>{t("account.loginNow")}</Button>
      </div>
    );
  }

  if (!cart) return <Skeleton className="h-96 rounded-xl" />;

  if (cart.items.length === 0) {
    return (
      <div className="grid place-items-center rounded-md bg-card py-16 text-center">
        <p className="text-sm font-semibold">{t("checkout.emptyCart")}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>{t("cart.startShopping")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">{t("checkout.title")}</h1>

      {/* address */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-fk-blue" />
          <h2 className="flex-1 text-sm font-bold">{t("checkout.deliveryAddress")}</h2>
          {!showForm && (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-semibold text-foreground" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> {t("checkout.addNew")}
            </Button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          {addresses.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                selected === a.id ? "border-primary bg-secondary" : "hover:bg-muted/50"
              )}
            >
              <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2", selected === a.id ? "border-primary" : "border-muted-foreground/40")}>
                {selected === a.id && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  {a.name} <span className="font-normal text-muted-foreground">· {a.phone}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {a.line}, {a.city} — {a.pincode}
                </span>
              </span>
            </button>
          ))}

          {showForm && (
            <div className="space-y-2.5 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1"><Label htmlFor="f-name">{t("checkout.name")}</Label><Input id="f-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1"><Label htmlFor="f-phone">{t("checkout.phone")}</Label><Input id="f-phone" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1"><Label htmlFor="f-pin">{t("checkout.pincode")}</Label><Input id="f-pin" inputMode="numeric" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} /></div>
                <div className="space-y-1"><Label htmlFor="f-city">{t("checkout.city")}</Label><Input id="f-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label htmlFor="f-line">{t("checkout.address")}</Label><Input id="f-line" value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} /></div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" onClick={saveAddress}>{t("common.save")}</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* payment */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <h2 className="text-sm font-bold">{t("checkout.paymentMethod")}</h2>
        <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "COD" | "UPI")} className="mt-3 gap-2.5">
          <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors", payment === "COD" ? "border-primary bg-secondary" : "hover:bg-muted/50")}>
            <RadioGroupItem value="COD" />
            <Banknote className="h-5 w-5 text-fk-blue" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{t("checkout.cod")}</span>
              <span className="block text-xs text-muted-foreground">{t("checkout.codDesc")}</span>
            </span>
          </label>
          <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors", payment === "UPI" ? "border-primary bg-secondary" : "hover:bg-muted/50")}>
            <RadioGroupItem value="UPI" />
            <Smartphone className="h-5 w-5 text-fk-blue" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{t("checkout.upi")}</span>
              <span className="block text-xs text-muted-foreground">{t("checkout.upiDesc")}</span>
            </span>
          </label>
        </RadioGroup>
      </section>

      {/* summary + place */}
      <section className="rounded-md bg-card p-4 shadow-fk">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("checkout.orderSummary")}</p>
        <div className="mt-2 space-y-1">
          {cart.items.map((i) => (
            <div key={i.product.id} className="flex justify-between text-xs">
              <span className="min-w-0 flex-1 truncate pr-3 text-muted-foreground">{i.product.name}</span>
              <span className="font-medium">{formatINR(i.product.price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t pt-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.itemsTotal")}</span>
            <span className="font-medium">{formatINR(cart.itemsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.deliveryFee")}</span>
            <span className={`font-medium ${cart.deliveryFee === 0 ? "text-green-700" : ""}`}>
              {cart.deliveryFee === 0 ? t("common.free") : formatINR(cart.deliveryFee)}
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>{t("cart.couponApplied", { code: coupon! })}</span>
              <span className="font-medium">−{formatINR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>{t("cart.grandTotal")}</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
        <Button className="mt-3.5 h-11 w-full rounded-sm bg-fk-coral font-bold text-white hover:bg-fk-orange" disabled={placing || (!selected && addresses.length === 0)} onClick={placeOrder}>
          {placing ? t("checkout.placing") : payment === "UPI" ? t("checkout.upi") + " →" : t("checkout.placeOrder")}
        </Button>
        <p className="mt-2.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <BadgeCheck className="h-3.5 w-3.5 text-green-600" /> {t("product.verifiedSeller")} · {t("product.codAvailable")}
        </p>
      </section>

      {upiOpen && (
        <UpiFlow
          open
          amount={total}
          onClose={() => setUpiOpen(false)}
          onPaid={() => doPlace("UPI")}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <CheckoutInner />
    </Suspense>
  );
}
