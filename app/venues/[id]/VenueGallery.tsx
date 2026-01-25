"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

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

  const [activeIndex, setActiveIndex] = useState(0);
  const active = all[activeIndex];

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? all.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === all.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="space-y-4">
      {/* Main Image */}
      <div className="group relative overflow-hidden rounded-3xl border bg-card">
        <div className="relative h-[280px] w-full sm:h-[400px] lg:h-[500px]">
          <Image
            src={active}
            alt={venueName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 768px, 1024px"
            priority
          />
          
          {/* Gradient Overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Image counter */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
            <ImageIcon className="h-4 w-4" />
            <span>
              {activeIndex + 1} / {all.length}
            </span>
          </div>

          {/* Navigation arrows (only if multiple images) */}
          {all.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {all.length > 1 && (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {all.map((src, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={[
                    "group relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition-all",
                    isActive
                      ? "border-primary scale-105 shadow-lg"
                      : "border-transparent hover:border-primary/50 hover:scale-105",
                  ].join(" ")}
                  aria-label={`View image ${idx + 1}`}
                  aria-pressed={isActive}
                >
                  <Image
                    src={src}
                    alt={`${venueName} - Image ${idx + 1}`}
                    fill
                    className="object-cover transition-opacity group-hover:opacity-80"
                    sizes="112px"
                  />
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}