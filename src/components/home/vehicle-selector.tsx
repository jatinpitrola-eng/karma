"use client";
import { useMemo, useState } from "react";
import { Bike, Car, Check, ChevronDown, ChevronLeft, X, CircleDot } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Vehicle = { id: string; key: string; type: string; brand: string; model: string };

/** Scooter icon fallback (lucide has no Scooter in this version) */
function ScooterIcon({ className }: { className?: string }) {
  return <CircleDot className={className} />;
}

export function VehicleChipBar() {
  const { t } = useI18n();
  const { vehicle, clear } = useVehicleStore();
  if (!vehicle) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-1.5 text-xs font-bold text-fk-text shadow-fk">
        {vehicle.brand} {vehicle.model}
        <button
          onClick={clear}
          aria-label={t("home.clear")}
          className="grid h-5 w-5 place-items-center rounded-full bg-fk-bg text-fk-muted hover:bg-fk-blue hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
      <span className="text-[11px] text-fk-muted">{t("home.vehicleActive")}</span>
    </div>
  );
}

export function VehicleSelector({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useI18n();
  const { vehicle, setVehicle } = useVehicleStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);

  const types = useMemo(() => [...new Set(vehicles.map((v) => v.type))], [vehicles]);
  const brands = useMemo(() => {
    if (!type) return [];
    return [...new Set(vehicles.filter((v) => v.type === type).map((v) => v.brand))];
  }, [type, vehicles]);
  const models = useMemo(() => {
    if (!type || !brand) return [];
    return vehicles.filter((v) => v.type === type && v.brand === brand);
  }, [type, brand, vehicles]);

  const typeIcon = (ty: string, cls = "h-4 w-4") =>
    ty === "CAR" ? <Car className={cls} /> : ty === "SCOOTER" ? <ScooterIcon className={cls} /> : <Bike className={cls} />;
  const typeLabel = (ty: string) => (ty === "CAR" ? t("vehicle.car") : ty === "SCOOTER" ? t("vehicle.scooter") : t("vehicle.bike"));

  const openSheet = () => {
    setType(null);
    setBrand(null);
    setOpen(true);
  };

  return (
    <>
      {/* full-width white pill */}
      <button
        onClick={openSheet}
        className="flex w-full items-center gap-3 rounded-md bg-white px-4 py-3 text-left shadow-fk transition-shadow hover:shadow-fk-lift"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-fk-blue">
          {typeIcon("BIKE", "h-5 w-5")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-fk-text">{t("home.findFit")}</span>
          <span className="block truncate text-xs text-fk-blue">{t("home.findFitCta")} →</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-fk-muted" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[82vh] overflow-y-auto rounded-t-2xl px-5 pb-8">
          <SheetHeader className="p-0 pb-3">
            <SheetTitle className="text-left text-fk-text">{t("vehicle.sheetTitle")}</SheetTitle>
          </SheetHeader>

          {!type && (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-fk-muted">{t("vehicle.stepType")}</p>
              <div className="space-y-2">
                {types.map((ty) => (
                  <button
                    key={ty}
                    onClick={() => setType(ty)}
                    className="flex w-full items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-fk-text hover:border-fk-blue hover:bg-accent"
                  >
                    {typeIcon(ty, "h-5 w-5 text-fk-blue")}
                    {typeLabel(ty)}
                    <ChevronDown className="ml-auto h-4 w-4 -rotate-90 text-fk-muted" />
                  </button>
                ))}
              </div>
            </>
          )}

          {type && !brand && (
            <>
              <button onClick={() => setType(null)} className="mb-2 flex items-center gap-1 text-xs font-semibold text-fk-blue">
                <ChevronLeft className="h-3.5 w-3.5" /> {typeLabel(type)}
              </button>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-fk-muted">{t("vehicle.stepBrand")}</p>
              <div className="space-y-2">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className="flex w-full items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-fk-text hover:border-fk-blue hover:bg-accent"
                  >
                    {b}
                    <ChevronDown className="ml-auto h-4 w-4 -rotate-90 text-fk-muted" />
                  </button>
                ))}
              </div>
            </>
          )}

          {type && brand && (
            <>
              <button onClick={() => setBrand(null)} className="mb-2 flex items-center gap-1 text-xs font-semibold text-fk-blue">
                <ChevronLeft className="h-3.5 w-3.5" /> {brand}
              </button>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-fk-muted">{t("vehicle.stepModel")}</p>
              <div className="space-y-2">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setVehicle(m);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-fk-text hover:border-fk-blue hover:bg-accent"
                    )}
                  >
                    {m.model}
                    <Check className="ml-auto h-4 w-4 text-fk-blue" />
                  </button>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
