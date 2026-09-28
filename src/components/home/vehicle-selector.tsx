"use client";
import { useMemo, useState } from "react";
import { Bike, Car, Bike as ScooterIcon, CheckCircle2, X, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Vehicle = { id: string; key: string; type: string; brand: string; model: string };

export function VehicleSelector({ vehicles }: { vehicles: Vehicle[] }) {
  const { t } = useI18n();
  const { vehicle, setVehicle, clear } = useVehicleStore();
  const [type, setType] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);

  const types = useMemo(() => {
    const s = new Map<string, string>();
    for (const v of vehicles) s.set(v.type, v.type);
    return [...s.keys()];
  }, [vehicles]);

  const brands = useMemo(() => {
    if (!type) return [];
    return [...new Set(vehicles.filter((v) => v.type === type).map((v) => v.brand))];
  }, [type, vehicles]);

  const models = useMemo(() => {
    if (!type || !brand) return [];
    return vehicles.filter((v) => v.type === type && v.brand === brand);
  }, [type, brand, vehicles]);

  const typeIcon = (ty: string) =>
    ty === "CAR" ? <Car className="h-4 w-4" /> : ty === "SCOOTER" ? <ScooterIcon className="h-4 w-4" /> : <Bike className="h-4 w-4" />;
  const typeLabel = (ty: string) => (ty === "CAR" ? t("vehicle.car") : ty === "SCOOTER" ? t("vehicle.scooter") : t("vehicle.bike"));

  if (vehicle) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 shadow-soft">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
          {typeIcon(vehicle.type)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{t("home.vehicleActive")}</p>
          <p className="truncate text-sm font-bold">
            {vehicle.brand} {vehicle.model}
          </p>
        </div>
        <button
          onClick={clear}
          className="flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
        >
          <X className="h-3.5 w-3.5" /> {t("home.clear")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm font-semibold">{t("home.selectVehicleTitle")}</p>

      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("home.vehicleType")}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {types.map((ty) => (
          <button
            key={ty}
            onClick={() => {
              setType(ty);
              setBrand(null);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              type === ty ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"
            )}
          >
            {typeIcon(ty)}
            {typeLabel(ty)}
          </button>
        ))}
      </div>

      {type && (
        <>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("home.brand")}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                  brand === b ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-secondary"
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </>
      )}

      {brand && (
        <>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("home.model")}</p>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setVehicle(m)}
                className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {m.model}
                <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
