// components/ImageUploader.tsx (or wherever your ImageUploader lives)
"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onChange: (next: { coverImageUrl?: string; imageUrls: string[] }) => void;
};

export default function ImageUploader({ onChange }: Props) {
  const [cover, setCover] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ lets you pick more images in multiple rounds (append)
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  function setCoverFile(file: File | null) {
    setCover(file);
    if (!file) return setCoverPreview(null);
    setCoverPreview(URL.createObjectURL(file));
  }

  function addGalleryFiles(files: File[]) {
    // ✅ append, de-dupe by name+size+lastModified, cap at 10
    setImages((prev) => {
      const merged = [...prev, ...files];
      const unique = Array.from(
        new Map(
          merged.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f] as const)
        ).values()
      ).slice(0, 10);

      setPreviews(unique.map((f) => URL.createObjectURL(f)));
      return unique;
    });

    // ✅ allow selecting the same file again later (some browsers need this)
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function clearGallery() {
    setImages([]);
    setPreviews([]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  async function upload() {
    setError(null);
    setIsUploading(true);

    try {
      const form = new FormData();
      if (cover) form.append("cover", cover);
      images.forEach((f) => form.append("images", f));

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const json = await res.json();

      if (!json?.ok) throw new Error(json?.error ?? "Upload failed.");

      onChange({
        coverImageUrl: json.coverUrl ?? undefined,
        imageUrls: json.imageUrls ?? [],
      });
    } catch (e: any) {
      setError(e?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div>
        <div className="text-sm font-medium">Cover image (optional)</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
        {coverPreview && (
          <div className="mt-2 relative h-40 w-full overflow-hidden rounded-xl border">
            <Image
              src={coverPreview}
              alt="Cover preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Gallery images (up to 10)</div>
          {images.length > 0 && (
            <button
              type="button"
              onClick={clearGallery}
              className="text-xs underline text-muted-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addGalleryFiles(Array.from(e.target.files ?? []))}
          className="mt-1 block w-full text-sm"
        />

        {previews.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previews.map((src) => (
              <div
                key={src}
                className="relative h-24 overflow-hidden rounded-xl border"
              >
                <Image src={src} alt="Preview" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-1 text-xs text-muted-foreground">
          Tip: you can select images more than once — we’ll append them (up to 10).
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Button type="button" onClick={upload} disabled={isUploading}>
        {isUploading ? "Uploading…" : "Upload images"}
      </Button>

      <div className="text-xs text-muted-foreground">
        After upload, the image URLs are saved into your submission payload.
      </div>
    </div>
  );
}
