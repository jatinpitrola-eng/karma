import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
        <p className="text-5xl" aria-hidden>🧭</p>
        <h1 className="mt-3 text-lg font-bold">Page not found</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          The page you are looking for doesn't exist or may have moved. Head back to the store and keep shopping.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft active:scale-95"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
