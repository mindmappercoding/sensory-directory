"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  venueSubmissionSchema,
  VenueSubmissionInput,
} from "@/lib/validators/venueSubmission";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmissionActionButton } from "../SubmissionActionButton";

const AVAILABLE_TAGS = [
  "softplay",
  "cinema",
  "museum",
  "park",
  "swimming",
  "sensory-friendly",
  "family",
  "indoor",
  "outdoor",
];

const LEVELS = ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="mt-1 text-xs text-red-600">{msg}</div>;
}

function levelLabel(v: string) {
  switch (v) {
    case "VERY_LOW":
      return "Very low";
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "VERY_HIGH":
      return "Very high";
    default:
      return v.replaceAll("_", " ");
  }
}

function uniq(arr: string[]) {
  return Array.from(new Set((arr ?? []).filter(Boolean)));
}

function asString(v: any) {
  return typeof v === "string" ? v : "";
}

function asBool(v: any, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}

function asStringArray(v: any) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

export function SubmissionEditForm({
  id,
  status,
  initialPayload,
  hasDuplicates,
}: {
  id: string;
  status: string;
  initialPayload: Record<string, unknown>;
  hasDuplicates: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const defaults: VenueSubmissionInput = {
    proposedName: asString(initialPayload.proposedName),
    description: asString(initialPayload.description),
    website: asString(initialPayload.website),
    phone: asString(initialPayload.phone),
    address1: asString(initialPayload.address1),
    address2: asString(initialPayload.address2),
    city: asString(initialPayload.city),
    postcode: asString(initialPayload.postcode),
    county: asString(initialPayload.county),
    tags: asStringArray(initialPayload.tags),

    coverImageUrl: asString(initialPayload.coverImageUrl),
    imageUrls: asStringArray(initialPayload.imageUrls),

    sensory: {
      noiseLevel: (initialPayload as any)?.sensory?.noiseLevel,
      lighting: (initialPayload as any)?.sensory?.lighting,
      crowding: (initialPayload as any)?.sensory?.crowding,
      quietSpace: asBool((initialPayload as any)?.sensory?.quietSpace, false),
      sensoryHours: asBool((initialPayload as any)?.sensory?.sensoryHours, false),
      notes: asString((initialPayload as any)?.sensory?.notes),
    },

    facilities: (initialPayload as any)?.facilities
      ? {
          parking: (initialPayload as any)?.facilities?.parking,
          accessibleToilet: (initialPayload as any)?.facilities?.accessibleToilet,
          babyChange: (initialPayload as any)?.facilities?.babyChange,
          wheelchairAccess: (initialPayload as any)?.facilities?.wheelchairAccess,
          staffTrained: (initialPayload as any)?.facilities?.staffTrained,
          notes: asString((initialPayload as any)?.facilities?.notes),
        }
      : undefined,
  };

  const form = useForm<VenueSubmissionInput>({
    resolver: zodResolver(venueSubmissionSchema),
    defaultValues: defaults,
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form;

  const selectedTags = watch("tags") ?? [];
  const sensory = watch("sensory");
  const facilities = watch("facilities");
  const cover = watch("coverImageUrl");
  const gallery = watch("imageUrls") ?? [];

  const tagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  function toggleTag(tag: string) {
    const next = tagSet.has(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setValue("tags", next, { shouldDirty: true, shouldValidate: true });
  }

  async function uploadFiles(opts: { cover?: File | null; images?: File[] }) {
    const fd = new FormData();
    if (opts.cover) fd.append("cover", opts.cover);
    for (const img of opts.images ?? []) fd.append("images", img);

    setUploading(true);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        toast.error(json?.error ?? "Upload failed");
        return;
      }

      if (typeof json.coverUrl === "string" && json.coverUrl) {
        setValue("coverImageUrl", json.coverUrl, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const newUrls = Array.isArray(json.imageUrls) ? json.imageUrls : [];
      if (newUrls.length) {
        const merged = uniq([...(getValues("imageUrls") ?? []), ...newUrls]).slice(
          0,
          10
        );
        setValue("imageUrls", merged, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      toast.success("Uploaded", { description: "Images added to submission." });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(values: VenueSubmissionInput) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/submissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proposedName: values.proposedName,
            payload: values,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.error ?? "Failed to save");
          return;
        }

        toast.success("Saved", { description: "Submission updated." });
      } catch (e: any) {
        toast.error(e?.message ?? "Failed to save");
      }
    });
  }

  const isPending = status === "PENDING";

  return (
    <form onSubmit={handleSubmit(save)} className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-4">
        <button
          type="submit"
          disabled={pending || uploading || !isPending}
          className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <SubmissionActionButton id={id} action="approve" />
        {hasDuplicates && <SubmissionActionButton id={id} action="approve" force />}
        <SubmissionActionButton id={id} action="reject" />

        {!isPending && (
          <span className="text-sm text-muted-foreground">
            This submission is {status} (editing disabled).
          </span>
        )}
      </div>

      {/* Images */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Images</div>
            <div className="text-xs text-muted-foreground">
              Upload/replace cover and gallery images for this submission.
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {uploading ? "Uploading…" : ""}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="rounded-lg border px-3 py-1 text-sm hover:bg-muted cursor-pointer">
            Upload cover
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!isPending || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (!f) return;
                uploadFiles({ cover: f, images: [] });
                e.currentTarget.value = "";
              }}
            />
          </label>

          <label className="rounded-lg border px-3 py-1 text-sm hover:bg-muted cursor-pointer">
            Upload gallery
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={!isPending || uploading}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                uploadFiles({ images: files });
                e.currentTarget.value = "";
              }}
            />
          </label>

          <button
            type="button"
            disabled={!isPending}
            onClick={() =>
              setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true })
            }
            className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
          >
            Remove cover
          </button>
        </div>

        <ErrorText msg={errors.coverImageUrl?.message as any} />
        <ErrorText msg={errors.imageUrls?.message as any} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Cover</div>
            {cover ? (
              <a href={cover} target="_blank" rel="noreferrer">
                <img
                  src={cover}
                  alt="Cover"
                  className="mt-2 w-full rounded-xl border object-cover aspect-[16/9]"
                />
              </a>
            ) : (
              <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                No cover image
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Gallery</div>
            {gallery.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {gallery.map((u) => (
                  <div key={u} className="relative">
                    <a href={u} target="_blank" rel="noreferrer">
                      <img
                        src={u}
                        alt="Gallery"
                        className="h-24 w-full rounded-lg border object-cover"
                      />
                    </a>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = gallery.filter((x) => x !== u);
                          setValue("imageUrls", next, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        className="absolute right-1 top-1 rounded bg-black/70 px-2 py-1 text-xs text-white"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                No gallery images
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main fields */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="text-sm font-semibold">Venue details</div>

        <div className="grid gap-4">
          <div>
            <div className="text-sm font-medium">Venue name</div>
            <Input disabled={!isPending} {...register("proposedName")} />
            <ErrorText msg={errors.proposedName?.message} />
          </div>

          <div>
            <div className="text-sm font-medium">Description</div>
            <Textarea disabled={!isPending} className="min-h-24" {...register("description")} />
            <ErrorText msg={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Website</div>
              <Input disabled={!isPending} {...register("website")} />
              <ErrorText msg={errors.website?.message as any} />
            </div>

            <div>
              <div className="text-sm font-medium">Phone</div>
              <Input disabled={!isPending} {...register("phone")} />
              <ErrorText msg={errors.phone?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Address line 1</div>
              <Input disabled={!isPending} {...register("address1")} />
              <ErrorText msg={errors.address1?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">Address line 2</div>
              <Input disabled={!isPending} {...register("address2")} />
              <ErrorText msg={errors.address2?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm font-medium">City</div>
              <Input disabled={!isPending} {...register("city")} />
              <ErrorText msg={errors.city?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">Postcode</div>
              <Input disabled={!isPending} {...register("postcode")} />
              <ErrorText msg={errors.postcode?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">County</div>
              <Input disabled={!isPending} {...register("county")} />
              <ErrorText msg={errors.county?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">Tags</div>
            <div className="text-xs text-muted-foreground">Minimum 1 required.</div>
          </div>
          {isPending && selectedTags.length > 0 && (
            <button
              type="button"
              className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
              onClick={() => setValue("tags", [], { shouldDirty: true, shouldValidate: true })}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((t) => {
            const selected = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                disabled={!isPending}
                onClick={() => toggleTag(t)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition disabled:opacity-50",
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background hover:bg-muted/60",
                ].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>

        <ErrorText msg={errors.tags?.message as any} />
      </div>

      {/* Sensory */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div>
          <div className="text-sm font-semibold">Sensory</div>
          <div className="text-xs text-muted-foreground">Required. Notes optional.</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-medium">Noise</div>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background disabled:opacity-50"
              value={(sensory as any)?.noiseLevel ?? ""}
              onChange={(e) =>
                setValue("sensory.noiseLevel", (e.target.value || undefined) as any, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value="">Select…</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
            <ErrorText msg={(errors.sensory as any)?.noiseLevel?.message} />
          </div>

          <div>
            <div className="text-sm font-medium">Lighting</div>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background disabled:opacity-50"
              value={(sensory as any)?.lighting ?? ""}
              onChange={(e) =>
                setValue("sensory.lighting", (e.target.value || undefined) as any, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value="">Select…</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
            <ErrorText msg={(errors.sensory as any)?.lighting?.message} />
          </div>

          <div>
            <div className="text-sm font-medium">Crowding</div>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background disabled:opacity-50"
              value={(sensory as any)?.crowding ?? ""}
              onChange={(e) =>
                setValue("sensory.crowding", (e.target.value || undefined) as any, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <option value="">Select…</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
            <ErrorText msg={(errors.sensory as any)?.crowding?.message} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!(sensory as any)?.quietSpace}
              onCheckedChange={(v) =>
                setValue("sensory.quietSpace", !!v, { shouldDirty: true, shouldValidate: true })
              }
            />
            Quiet space available (tick = yes)
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!(sensory as any)?.sensoryHours}
              onCheckedChange={(v) =>
                setValue("sensory.sensoryHours", !!v, { shouldDirty: true, shouldValidate: true })
              }
            />
            Sensory hours offered (tick = yes)
          </label>
        </div>

        <div>
          <div className="text-sm font-medium">Sensory notes</div>
          <Textarea disabled={!isPending} className="min-h-20" {...register("sensory.notes")} />
          <ErrorText msg={(errors.sensory as any)?.notes?.message} />
        </div>
      </div>

      {/* Facilities (optional) */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div>
          <div className="text-sm font-semibold">Facilities (optional)</div>
          <div className="text-xs text-muted-foreground">Optional.</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.parking}
              onCheckedChange={(v) =>
                setValue("facilities.parking", !!v, { shouldDirty: true })
              }
            />
            Parking
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.accessibleToilet}
              onCheckedChange={(v) =>
                setValue("facilities.accessibleToilet", !!v, { shouldDirty: true })
              }
            />
            Accessible toilet
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.babyChange}
              onCheckedChange={(v) =>
                setValue("facilities.babyChange", !!v, { shouldDirty: true })
              }
            />
            Baby change
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.wheelchairAccess}
              onCheckedChange={(v) =>
                setValue("facilities.wheelchairAccess", !!v, { shouldDirty: true })
              }
            />
            Wheelchair access
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.staffTrained}
              onCheckedChange={(v) =>
                setValue("facilities.staffTrained", !!v, { shouldDirty: true })
              }
            />
            Staff trained/supportive
          </label>
        </div>

        <div>
          <div className="text-sm font-medium">Facilities notes</div>
          <Textarea
            disabled={!isPending}
            className="min-h-20"
            {...register("facilities.notes")}
          />
          <ErrorText msg={(errors.facilities as any)?.notes?.message} />
        </div>

        <details className="rounded-xl border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold">Raw payload</summary>
          <pre className="mt-3 max-h-[320px] overflow-auto rounded-xl border bg-muted/30 p-3 text-xs">
            {JSON.stringify(getValues(), null, 2)}
          </pre>
        </details>
      </div>
    </form>
  );
}
