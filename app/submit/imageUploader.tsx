"use client";

import Image from "next/image";
import * as React from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ImageIcon, CheckCircle } from "lucide-react";

type Props = {
  onChange: (next: { coverImageUrl?: string; imageUrls: string[] }) => void;
  mode?: "manual" | "deferred";
  disabled?: boolean;
  maxImages?: number;
};

export type ImageUploaderHandle = {
  upload: () => Promise<{ coverImageUrl?: string; imageUrls: string[] } | null>;
  hasQueuedFiles: () => boolean;
  clearSelection: () => void;
  openCoverPicker: () => void;
  openGalleryPicker: () => void;
};

function uniqFiles(files: File[]) {
  return Array.from(
    new Map(
      files.map((f) => [`${f.name}-${f.size}-${f.lastModified}`, f] as const)
    ).values()
  );
}

const ImageUploader = React.forwardRef<ImageUploaderHandle, Props>(
  function ImageUploader(
    { onChange, mode = "manual", disabled = false, maxImages = 10 }: Props,
    ref
  ) {
    const [cover, setCover] = useState<File | null>(null);
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const coverInputRef = useRef<HTMLInputElement | null>(null);
    const galleryInputRef = useRef<HTMLInputElement | null>(null);

    const canInteract = !disabled && !isUploading;

    React.useEffect(() => {
      return () => {
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        previews.forEach((p) => URL.revokeObjectURL(p));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openCoverPicker() {
      if (!canInteract) return;
      coverInputRef.current?.click();
    }

    function openGalleryPicker() {
      if (!canInteract) return;
      galleryInputRef.current?.click();
    }

    function setCoverFile(file: File | null) {
      setError(null);

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
        const merged = uniqFiles([...prev, ...files]).slice(0, maxImages);

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

    function clearSelection() {
      setError(null);

      if (coverPreview) URL.revokeObjectURL(coverPreview);
      previews.forEach((p) => URL.revokeObjectURL(p));

      setCover(null);
      setCoverPreview(null);
      setImages([]);
      setPreviews([]);

      if (coverInputRef.current) coverInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }

    async function upload(): Promise<{
      coverImageUrl?: string;
      imageUrls: string[];
    } | null> {
      setError(null);

      if (!cover && images.length === 0) {
        setError("Please select a cover and/or gallery images first.");
        return null;
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

        const result = {
          coverImageUrl: json.coverUrl ?? undefined,
          imageUrls: json.imageUrls ?? [],
        };

        onChange(result);

        clearSelection();

        return result;
      } catch (e: any) {
        setError(e?.message ?? "Upload failed.");
        return null;
      } finally {
        setIsUploading(false);
      }
    }

    React.useImperativeHandle(
      ref,
      () => ({
        upload,
        hasQueuedFiles: () => !!cover || images.length > 0,
        clearSelection,
        openCoverPicker,
        openGalleryPicker,
      }),
      [cover, images, coverPreview, previews, canInteract]
    );

    const queuedCover = cover ? 1 : 0;
    const queuedGallery = images.length;
    const queuedTotal = queuedCover + queuedGallery;

    return (
      <div className="space-y-6 rounded-3xl border bg-card p-6">
        {/* COVER */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Cover image</label>
            {cover && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-xl px-3"
                onClick={() => setCoverFile(null)}
                disabled={!canInteract}
              >
                <X className="h-3 w-3" />
                Remove
              </Button>
            )}
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="hidden"
            disabled={!canInteract}
          />

          {coverPreview ? (
            <div className="group relative overflow-hidden rounded-2xl border">
              <div className="relative h-48 w-full">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openCoverPicker}
                  disabled={!canInteract}
                  className="rounded-xl"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openCoverPicker}
              disabled={!canInteract}
              className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload cover image</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG or WebP
                </p>
              </div>
            </button>
          )}
        </div>

        {/* GALLERY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Gallery images
              {queuedGallery > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({queuedGallery}/{maxImages})
                </span>
              )}
            </label>
            {queuedGallery > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-xl px-3"
                onClick={clearGallery}
                disabled={!canInteract}
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addGalleryFiles(Array.from(e.target.files ?? []))}
            className="hidden"
            disabled={!canInteract}
          />

          {previews.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.map((src, idx) => (
                <div
                  key={src}
                  className="group relative overflow-hidden rounded-2xl border"
                >
                  <div className="relative h-32">
                    <Image
                      src={src}
                      alt={`Gallery preview ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute right-2 top-2">
                    <div className="rounded-full bg-emerald-500 p-1">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              ))}

              {queuedGallery < maxImages && (
                <button
                  type="button"
                  onClick={openGalleryPicker}
                  disabled={!canInteract}
                  className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add more</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openGalleryPicker}
              disabled={!canInteract}
              className="flex h-32 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to add gallery images</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to {maxImages} images
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Status */}
        <div className="rounded-2xl bg-muted/50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {queuedTotal === 0
                ? "No images selected"
                : mode === "deferred"
                ? "Images will upload when you submit"
                : "Ready to upload"}
            </span>
            {queuedTotal > 0 && (
              <span className="font-medium">
                {queuedCover ? "1 cover" : "No cover"} + {queuedGallery} gallery
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {mode === "manual" && (
          <Button
            type="button"
            onClick={upload}
            disabled={!canInteract || queuedTotal === 0}
            className="w-full rounded-2xl"
          >
            {isUploading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {queuedTotal} {queuedTotal === 1 ? "image" : "images"}
              </>
            )}
          </Button>
        )}
      </div>
    );
  }
);

export default ImageUploader;