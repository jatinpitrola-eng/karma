"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n, localizedCatName, type Lang } from "@/lib/i18n";
import { SellerGate } from "../seller-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string; nameHi: string; nameGu: string };
type Vehicle = { id: string; key: string; type: string; brand: string; model: string };

function ProductForm() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const editId = sp.get("edit");

  const [cats, setCats] = useState<Cat[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ name: "", categoryId: "", price: "", mrp: "", stock: "10", partNumber: "", description: "" });
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
    ])
      .then(([c, v]) => {
        setCats(c.categories ?? []);
        setVehicles(v.vehicles ?? []);
      })
      .catch(() => {});
  }, []);

  // load product for edit
  useEffect(() => {
    if (!editId) return;
    fetch("/api/retailer/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const p = (d.products ?? []).find((x: { id: string }) => x.id === editId);
        if (p) {
          setForm({
            name: p.name,
            categoryId: p.category.slug,
            price: String(p.price),
            mrp: String(p.mrp),
            stock: String(p.stock),
            partNumber: p.partNumber,
            description: p.description ?? "",
          });
          setSelectedVehicles((p.vehicles ?? []).map((v: { id: string }) => v.id));
        }
      })
      .catch(() => {});
  }, [editId]);

  const save = async () => {
    const { name, categoryId, price, mrp, stock, partNumber, description } = form;
    if (!name || !categoryId || !price || !mrp || !partNumber) {
      import("sonner").then(({ toast }) => toast.error(t("common.error")));
      return;
    }
    if (Number(price) > Number(mrp)) {
      import("sonner").then(({ toast }) => toast.error("MRP must be ≥ price"));
      return;
    }
    if (selectedVehicles.length < 2) {
      import("sonner").then(({ toast }) => toast.error(t("seller.vehiclesHint")));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(editId ? `/api/retailer/products/${editId}` : "/api/retailer/products", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryId, price: Number(price), mrp: Number(mrp), stock: Number(stock), partNumber, description, vehicleIds: selectedVehicles }),
      });
      const data = await res.json();
      if (data.ok) {
        import("sonner").then(({ toast }) => toast.success(t("seller.productSaved")));
        router.push("/seller/products");
      } else {
        import("sonner").then(({ toast }) => toast.error(data.error === "PENDING_APPROVAL" ? t("seller.pendingTitle") : t("common.error")));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="px-1 text-lg font-bold">{editId ? t("seller.editProduct") : t("seller.addProduct")}</h1>

      <div className="space-y-3.5 rounded-xl border bg-card p-4 shadow-soft">
        <div className="space-y-1.5">
          <Label htmlFor="pname">{t("seller.productName")}</Label>
          <Input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Brake Pad Set — Bajaj Pulsar 150" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("seller.category")}</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{localizedCatName(c, lang)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pnum">{t("seller.partNumber")}</Label>
            <Input id="pnum" value={form.partNumber} onChange={(e) => setForm({ ...form, partNumber: e.target.value })} placeholder="BPD-PG-150" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pprice">{t("seller.price")}</Label>
            <Input id="pprice" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pmrp">{t("seller.mrp")}</Label>
            <Input id="pmrp" inputMode="numeric" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pstock">{t("seller.stock")}</Label>
            <Input id="pstock" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/\D/g, "") })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("seller.vehicles")}</Label>
          <p className="text-[11px] text-muted-foreground">{t("seller.vehiclesHint")}</p>
          <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border p-2.5 thin-scrollbar sm:grid-cols-2">
            {vehicles.map((v) => (
              <label key={v.id} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs font-medium", selectedVehicles.includes(v.id) && "border-primary bg-secondary")}>
                <Checkbox
                  checked={selectedVehicles.includes(v.id)}
                  onCheckedChange={(c) => setSelectedVehicles((prev) => (c ? [...prev, v.id] : prev.filter((x) => x !== v.id)))}
                />
                {v.brand} {v.model}
                <span className="ml-auto text-[10px] uppercase text-muted-foreground">{v.type}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] font-semibold text-primary">{t("seller.selected")}: {selectedVehicles.length}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pdesc">{t("seller.description")}</Label>
          <Textarea id="pdesc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("seller.productImages")}</Label>
          <div className="flex gap-2">
            {["from-yellow-50 to-amber-100", "from-amber-50 to-yellow-100", "from-yellow-100 to-amber-200"].map((g, i) => (
              <div key={i} className={cn("grid h-16 w-16 place-items-center rounded-lg border bg-gradient-to-br text-xl", g)}>
                {["🔧", "⚙️", "🔩"][i]}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Demo placeholder images — auto-generated</p>
        </div>

        <Button className="h-11 w-full font-bold" disabled={busy} onClick={save}>
          {t("seller.saveProduct")}
        </Button>
      </div>
    </div>
  );
}

export default function SellerProductNewPage() {
  return (
    <SellerGate>
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ProductForm />
      </Suspense>
    </SellerGate>
  );
}
