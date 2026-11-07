import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline — KARMA" };

export default function OfflinePage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="rounded-md bg-card p-8 text-center shadow-fk">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </span>
        <h1 className="mt-4 text-lg font-bold">You are offline</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          Check your internet connection. The KARMA app shell is cached and will load instantly — reconnect to browse parts.
        </p>
      </div>
    </div>
  );
}
