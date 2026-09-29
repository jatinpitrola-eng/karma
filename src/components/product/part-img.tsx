"use client";
import { useState } from "react";
import { PART_PLACEHOLDER } from "@/lib/format";

/**
 * Real-photo <img> with guaranteed fallback — a broken-image icon must NEVER appear.
 * Plain <img> (not next/image) per spec: avoids domain config; w=600 lazy loaded.
 */
export function PartImg({
  src,
  alt,
  className,
  eager,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [err, setErr] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  // adjust state during render when src changes (React-recommended pattern, lint-safe)
  if (lastSrc !== src) {
    setLastSrc(src);
    setErr(false);
  }
  const finalSrc = src && !err ? src : PART_PLACEHOLDER;
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setErr(true)}
      draggable={false}
      className={className}
    />
  );
}
