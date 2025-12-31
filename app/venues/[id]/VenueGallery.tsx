"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function VenueGallery({
  venueName,
  coverImageUrl,
  imageUrls,
}: {
  venueName: string;
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
}) {
  const images = useMemo(() => {
    const list = [
      ...(coverImageUrl ? [coverImageUrl] : []),
      ...((imageUrls ?? []).filter(Boolean) as string[]),
    ];

    // de-dupe
    return Array.from(new Set(list)).slice(0, 12);
  }, [coverImageUrl, imageUrls]);

  const fallback = "/600x400.png";
  const all = images.length ? images : [fallback];

  const [active, setActive] = useState(all[0]);

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-[220px] w-full sm:h-[320px]">
          <Image
            src={active}
            alt={venueName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 768px"
            priority
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Images: {all.length}</div>

      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((src) => {
            const isActive = src === active;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setActive(src)}
                className={[
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border",
                  isActive ? "ring-2 ring-primary" : "hover:bg-muted/30",
                ].join(" ")}
                aria-label="View image"
                aria-pressed={isActive}
              >
                <Image
                  src={src}
                  alt={venueName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
