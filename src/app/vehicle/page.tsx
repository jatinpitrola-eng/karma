"use client";
import { useEffect, useState } from "react";
import { Bike } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useVehicleStore } from "@/lib/store";
import { VehicleSelector, VehicleChipBar } from "@/components/home/vehicle-selector";
import { PartImg } from "@/components/product/part-img";
import { Skeleton } from "@/components/ui/skeleton";

type Vehicle = { id: string; key: string; type: string; brand: string; model: string };

export default function VehiclePage() {
  const { t } = useI18n();
  const vehicle = useVehicleStore((s) => s.vehicle);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => setVehicles(d.vehicles ?? []))
      .catch(() => setVehicles([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-fk-blue text-white">
          <Bike className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-base font-bold text-fk-text">{t("nav.vehicle")}</h1>
          <p className="text-xs text-fk-muted">{t("vehicle.sheetTitle")}</p>
        </div>
      </div>

      <VehicleChipBar />

      {vehicle ? (
        <div className="flex items-center gap-3 rounded-md bg-green-50 p-4 shadow-fk">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fk-green text-white">✓</span>
          <p className="text-sm font-bold text-fk-green">
            {t("product.perfectFit", { n: `${vehicle.brand} ${vehicle.model}` })}
          </p>
        </div>
      ) : null}

      {vehicles ? <VehicleSelector vehicles={vehicles} /> : <Skeleton className="h-[68px] rounded-md" />}

      <div className="overflow-hidden rounded-md bg-white shadow-fk">
        <PartImg
          src="https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=600&auto=format&fit=crop"
          alt={t("nav.vehicle")}
          className="h-40 w-full object-cover"
        />
        <p className="px-4 py-3 text-xs text-fk-muted">{t("home.findFit")}</p>
      </div>
    </div>
  );
}
