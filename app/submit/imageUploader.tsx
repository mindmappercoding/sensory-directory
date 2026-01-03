"use client";

import Image from "next/image";
import * as React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onChange: (next: { coverImageUrl?: string; imageUrls: string[] }) => void;
};

function uniqFiles(files: File[]) {
  return Array.from(
    new Map(
      files.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f] as const)
    ).values()
  );
}

export default function ImageUploader({ onChange }: Props) {
  const [cover, setCover] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ prevent memory leaks from object URLs
  React.useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setCoverFile(file: File | null) {
    setError(null);

    // revoke old cover preview
    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCover(file);
    if (!file) {
      setCoverPreview(null);
      return;
    }
    setCoverPreview(URL.createObjectURL(file));
  }

  function addGalleryFiles(files: File[]) {
    setError(null);

    setImages((prev) => {
      const merged = uniqFiles([...prev, ...files]).slice(0, 10);

      // revoke old previews
      previews.forEach((p) => URL.revokeObjectURL(p));

      setPreviews(merged.map((f) => URL.createObjectURL(f)));
      return merged;
    });

    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function clearGallery() {
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImages([]);
    setPreviews([]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  async function upload() {
    setError(null);

    // nothing selected
    if (!cover && images.length === 0) {
      setError("Please select a cover and/or gallery images first.");
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      if (cover) form.append("cover", cover);
      images.forEach((f) => form.append("images", f));

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Upload failed.");
      }

      onChange({
        coverImageUrl: json.coverUrl ?? undefined,
        imageUrls: json.imageUrls ?? [],
      });

      // ✅ clear local selection after successful upload
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      previews.forEach((p) => URL.revokeObjectURL(p));

      setCover(null);
      setCoverPreview(null);
      setImages([]);
      setPreviews([]);
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    } catch (e: any) {
      setError(e?.message ?? "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const queuedCover = cover ? 1 : 0;
  const queuedGallery = images.length;
  const queuedTotal = queuedCover + queuedGallery;

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4">
      {/* COVER */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Cover image (optional)</div>

        {/* Hidden input */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploading}
          >
            Choose cover image
          </Button>

          <div className="text-xs text-muted-foreground">
            {cover ? cover.name : "No cover selected"}
          </div>

          {cover && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => setCoverFile(null)}
              disabled={isUploading}
            >
              Remove
            </Button>
          )}
        </div>

        {coverPreview && (
          <div className="relative h-40 w-full overflow-hidden rounded-xl border">
            <Image
              src={coverPreview}
              alt="Cover preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* GALLERY */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            Gallery images (up to 10)
            {queuedGallery > 0 ? ` • ${queuedGallery} selected` : ""}
          </div>

          {queuedGallery > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={clearGallery}
              disabled={isUploading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Hidden input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addGalleryFiles(Array.from(e.target.files ?? []))}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading || queuedGallery >= 10}
          >
            {queuedGallery > 0 ? "Add more images" : "Choose gallery images"}
          </Button>

          <div className="text-xs text-muted-foreground">
            {queuedGallery === 0
              ? "No gallery images selected"
              : `${queuedGallery} selected`}
          </div>
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        <div className="text-xs text-muted-foreground">
          Ready to upload:{" "}
          {queuedTotal === 0
            ? "nothing selected"
            : `${queuedCover ? "1 cover" : "0 cover"} + ${queuedGallery} gallery`}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Button type="button" onClick={upload} disabled={isUploading}>
        {isUploading ? "Uploading…" : "Upload images"}
      </Button>

      <div className="text-xs text-muted-foreground">
        After upload, image URLs are returned — your form must include them in
        the submit payload.
      </div>
    </div>
  );
}
