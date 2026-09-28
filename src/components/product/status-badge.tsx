"use client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BadgeCheck, CircleDashed, XCircle } from "lucide-react";

const colors: Record<string, string> = {
  PLACED: "bg-sky-100 text-sky-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", colors[status] ?? "bg-muted text-foreground")}>
      {t(`orders.status.${status}`)}
    </span>
  );
}

export function OrderTimeline({ events, status }: { events: { id: string; status: string; createdAt: string }[]; status: string }) {
  const { t } = useI18n();
  const FLOW = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
  const doneMap = new Map(events.map((e) => [e.status, e]));

  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
        <XCircle className="h-6 w-6 text-red-600" />
        <p className="text-sm font-semibold text-red-700">{t("orders.status.CANCELLED")}</p>
      </div>
    );
  }

  const currentIdx = FLOW.indexOf(status);

  return (
    <ol className="relative space-y-0">
      {FLOW.map((step, i) => {
        const ev = doneMap.get(step);
        const done = !!ev;
        const active = i === currentIdx;
        return (
          <li key={step} className="relative flex gap-3.5 pb-6 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className={cn("absolute left-[11px] top-6 h-full w-0.5", done ? "bg-green-500" : "bg-muted-foreground/20")} />
            )}
            <span
              className={cn(
                "relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2",
                done ? "border-green-500 bg-green-500 text-white" : "border-muted-foreground/25 bg-muted"
              )}
            >
              {done ? <BadgeCheck className="h-4 w-4" /> : <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={cn("text-sm", active ? "font-bold text-primary" : done ? "font-semibold" : "text-muted-foreground")}>
                {t(`orders.status.${step}`)}
              </p>
              {ev && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {new Date(ev.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {active && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary live-dot" />}
          </li>
        );
      })}
    </ol>
  );
}
