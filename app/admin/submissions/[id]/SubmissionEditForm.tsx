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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmissionActionButton } from "../SubmissionActionButton";
import {
  Building2,
  Globe,
  Phone,
  MapPin,
  Tag,
  Volume2,
  Sun,
  Users,
  Sparkles,
  Car,
  Accessibility,
  Baby,
  UserCheck,
  Save,
  Upload,
  X,
  ImageIcon,
  FileText,
  AlertTriangle,
} from "lucide-react";

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
  return (
    <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertTriangle className="h-3 w-3" />
      {msg}
    </div>
  );
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
        const merged = uniq([...(getValues("imageUrls") ?? []), ...newUrls]).slice(0, 10);
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
      <div className="rounded-3xl border bg-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Actions</h3>
            <p className="text-sm text-muted-foreground">
              Save changes or approve/reject this submission
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="submit"
            disabled={pending || uploading || !isPending}
            variant="outline"
            size="sm"
            className="rounded-2xl"
          >
            {pending ? (
              <>
                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-3.5 w-3.5" />
                Save changes
              </>
            )}
          </Button>

          <div className="h-6 w-px bg-border" />

          <SubmissionActionButton id={id} action="approve" />
          {hasDuplicates && <SubmissionActionButton id={id} action="approve" force />}
          <SubmissionActionButton id={id} action="reject" />

          {!isPending && (
            <span className="ml-2 text-sm text-muted-foreground">
              This submission is {status} (editing disabled)
            </span>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Images</h3>
            <p className="text-sm text-muted-foreground">
              Upload or manage submission images
            </p>
            {uploading && (
              <p className="mt-1 text-xs text-amber-600">Uploading…</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label
            className={[
              "inline-flex cursor-pointer items-center gap-2 rounded-2xl border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted",
              !isPending || uploading ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            <Upload className="h-3.5 w-3.5" />
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

          <label
            className={[
              "inline-flex cursor-pointer items-center gap-2 rounded-2xl border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted",
              !isPending || uploading ? "cursor-not-allowed opacity-50" : "",
            ].join(" ")}
          >
            <Upload className="h-3.5 w-3.5" />
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

          <Button
            type="button"
            disabled={!isPending}
            onClick={() =>
              setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true })
            }
            variant="ghost"
            size="sm"
            className="rounded-2xl"
          >
            <X className="mr-2 h-3.5 w-3.5" />
            Remove cover
          </Button>
        </div>

        <ErrorText msg={errors.coverImageUrl?.message as any} />
        <ErrorText msg={errors.imageUrls?.message as any} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label className="mb-2 text-sm font-medium">Cover</Label>
            {cover ? (
              <a href={cover} target="_blank" rel="noreferrer">
                <img
                  src={cover}
                  alt="Cover"
                  className="mt-2 aspect-[16/9] w-full rounded-2xl border object-cover"
                />
              </a>
            ) : (
              <div className="mt-2 rounded-2xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                No cover image
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 text-sm font-medium">Gallery</Label>
            {gallery.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {gallery.map((u) => (
                  <div key={u} className="group relative">
                    <a href={u} target="_blank" rel="noreferrer">
                      <img
                        src={u}
                        alt="Gallery"
                        className="h-24 w-full rounded-2xl border object-cover"
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
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 opacity-0 transition group-hover:opacity-100"
                        title="Remove image"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded-2xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                No gallery images
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main fields */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Venue Details</h3>
            <p className="text-sm text-muted-foreground">Basic venue information</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <Label>Venue name</Label>
            <Input
              disabled={!isPending}
              {...register("proposedName")}
              className="rounded-2xl"
            />
            <ErrorText msg={errors.proposedName?.message} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              disabled={!isPending}
              className="min-h-24 rounded-2xl"
              {...register("description")}
            />
            <ErrorText msg={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Website
              </Label>
              <Input
                disabled={!isPending}
                {...register("website")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.website?.message as any} />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone
              </Label>
              <Input
                disabled={!isPending}
                {...register("phone")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.phone?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Address line 1</Label>
              <Input
                disabled={!isPending}
                {...register("address1")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.address1?.message} />
            </div>

            <div>
              <Label>Address line 2</Label>
              <Input
                disabled={!isPending}
                {...register("address2")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.address2?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>City</Label>
              <Input
                disabled={!isPending}
                {...register("city")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.city?.message} />
            </div>

            <div>
              <Label>Postcode</Label>
              <Input
                disabled={!isPending}
                {...register("postcode")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.postcode?.message} />
            </div>

            <div>
              <Label>County</Label>
              <Input
                disabled={!isPending}
                {...register("county")}
                className="rounded-2xl"
              />
              <ErrorText msg={errors.county?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Tags</h3>
              <p className="text-sm text-muted-foreground">Minimum 1 required</p>
            </div>
          </div>
          {isPending && selectedTags.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-2xl"
              onClick={() => setValue("tags", [], { shouldDirty: true, shouldValidate: true })}
            >
              Clear
            </Button>
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
                  "rounded-full border px-4 py-2 text-sm transition disabled:opacity-50",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
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
      <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Sensory</h3>
            <p className="text-sm text-muted-foreground">Required. Notes optional</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              Noise
            </Label>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-2xl border bg-background px-3 py-2 text-sm disabled:opacity-50"
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
            <Label className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Lighting
            </Label>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-2xl border bg-background px-3 py-2 text-sm disabled:opacity-50"
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
            <Label className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Crowding
            </Label>
            <select
              disabled={!isPending}
              className="mt-1 w-full rounded-2xl border bg-background px-3 py-2 text-sm disabled:opacity-50"
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
          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!(sensory as any)?.quietSpace}
              onCheckedChange={(v) =>
                setValue("sensory.quietSpace", !!v, { shouldDirty: true, shouldValidate: true })
              }
            />
            Quiet space available (tick = yes)
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm">
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
          <Label>Sensory notes</Label>
          <Textarea
            disabled={!isPending}
            className="min-h-20 rounded-2xl"
            {...register("sensory.notes")}
          />
          <ErrorText msg={(errors.sensory as any)?.notes?.message} />
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Accessibility className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Facilities (optional)</h3>
            <p className="text-sm text-muted-foreground">Optional amenities</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.parking}
              onCheckedChange={(v) =>
                setValue("facilities.parking", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              Parking
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.accessibleToilet}
              onCheckedChange={(v) =>
                setValue("facilities.accessibleToilet", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Accessible toilet
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.babyChange}
              onCheckedChange={(v) =>
                setValue("facilities.babyChange", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <Baby className="h-3.5 w-3.5 text-muted-foreground" />
              Baby change
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.wheelchairAccess}
              onCheckedChange={(v) =>
                setValue("facilities.wheelchairAccess", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Wheelchair access
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm">
            <Checkbox
              disabled={!isPending}
              checked={!!facilities?.staffTrained}
              onCheckedChange={(v) =>
                setValue("facilities.staffTrained", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Staff trained/supportive
            </span>
          </label>
        </div>

        <div>
          <Label>Facilities notes</Label>
          <Textarea
            disabled={!isPending}
            className="min-h-20 rounded-2xl"
            {...register("facilities.notes")}
          />
          <ErrorText msg={(errors.facilities as any)?.notes?.message} />
        </div>

        <details className="rounded-2xl border bg-muted/20 p-4">
          <summary className="cursor-pointer text-sm font-semibold">Raw payload</summary>
          <pre className="mt-3 max-h-[320px] overflow-auto rounded-2xl border bg-muted/30 p-3 text-xs">
            {JSON.stringify(getValues(), null, 2)}
          </pre>
        </details>
      </div>
    </form>
  );
}