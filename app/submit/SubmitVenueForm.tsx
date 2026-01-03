"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  venueSubmissionSchema,
  VenueSubmissionInput,
} from "@/lib/validators/venueSubmission";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import ImageUploader from "./imageUploader";

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
  // nicer labels
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

export default function SubmitVenueForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<VenueSubmissionInput>({
    resolver: zodResolver(venueSubmissionSchema),
    defaultValues: {
      proposedName: "",
      description: "",
      website: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      postcode: "",
      county: "",
      tags: [],

      // ✅ images
      coverImageUrl: "",
      imageUrls: [],

      sensory: {
        noiseLevel: undefined,
        lighting: undefined,
        crowding: undefined,
        quietSpace: undefined,
        sensoryHours: undefined,
        notes: "",
      },
      facilities: {
        parking: undefined,
        accessibleToilet: undefined,
        babyChange: undefined,
        wheelchairAccess: undefined,
        staffTrained: undefined,
        notes: "",
      },
    },
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

  const tagSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  function toggleTag(tag: string) {
    const next = tagSet.has(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setValue("tags", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: VenueSubmissionInput) {
    setServerError(null);

    // ✅ Force-pull latest image fields from RHF state so they always get included
    const coverImageUrl = getValues("coverImageUrl") ?? "";
    const imageUrls = getValues("imageUrls") ?? [];

    const payload: VenueSubmissionInput = {
      ...values,
      coverImageUrl,
      imageUrls,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "NEW_VENUE",
            proposedName: payload.proposedName,
            payload,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json?.ok) {
          const msg =
            json?.error ??
            "Something went wrong. Please check the form and try again.";
          setServerError(msg);
          toast.error(msg);
          return;
        }

        toast.success("Submitted! 🎉", {
          description: "Thanks — we’ll review it before it goes live.",
        });

        form.reset();
      } catch (e: any) {
        const msg = e?.message ?? "Server error";
        setServerError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* IMAGES */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Photos</div>
            <div className="text-xs text-muted-foreground">
              Optional, but super helpful for parents.
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ImageUploader
            onChange={(next) => {
              const prevCover = getValues("coverImageUrl") ?? "";
              const prevGallery = getValues("imageUrls") ?? [];

              if (typeof next.coverImageUrl === "string" && next.coverImageUrl) {
                setValue("coverImageUrl", next.coverImageUrl, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              } else if (!prevCover) {
                setValue("coverImageUrl", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }

              // ✅ Merge (append) gallery uploads instead of overwriting
              const merged = uniq([...prevGallery, ...(next.imageUrls ?? [])]).slice(0, 10);
              setValue("imageUrls", merged, {
                shouldDirty: true,
                shouldValidate: true,
              });

              toast.success("Images uploaded", {
                description: "They’ll be included in your submission.",
              });
            }}
          />
          <ErrorText msg={errors.coverImageUrl?.message as any} />
          <ErrorText msg={errors.imageUrls?.message as any} />
        </div>
      </div>

      {/* VENUE INFO */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Venue details</div>
            <div className="text-xs text-muted-foreground">
              The basics so families can find it easily.
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <div className="text-sm font-medium">Venue name *</div>
            <Input
              placeholder="e.g. Calm Kids Soft Play"
              {...register("proposedName")}
            />
            <ErrorText msg={errors.proposedName?.message} />
          </div>

          <div>
            <div className="text-sm font-medium">Description</div>
            <Textarea
              placeholder="What makes it good for sensory needs?"
              className="min-h-24"
              {...register("description")}
            />
            <ErrorText msg={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Website</div>
              <Input placeholder="https://…" {...register("website")} />
              <ErrorText msg={errors.website?.message as any} />
            </div>

            <div>
              <div className="text-sm font-medium">Phone</div>
              <Input placeholder="Optional" {...register("phone")} />
              <ErrorText msg={errors.phone?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium">Address line 1</div>
              <Input placeholder="Optional" {...register("address1")} />
              <ErrorText msg={errors.address1?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">Address line 2</div>
              <Input placeholder="Optional" {...register("address2")} />
              <ErrorText msg={errors.address2?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm font-medium">City *</div>
              <Input placeholder="e.g. Otley" {...register("city")} />
              <ErrorText msg={errors.city?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">Postcode *</div>
              <Input placeholder="e.g. LS21…" {...register("postcode")} />
              <ErrorText msg={errors.postcode?.message} />
            </div>

            <div>
              <div className="text-sm font-medium">County</div>
              <Input placeholder="e.g. West Yorkshire" {...register("county")} />
              <ErrorText msg={errors.county?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* TAGS */}
      <div className="rounded-3xl border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Tags *</div>
            <div className="text-xs text-muted-foreground">
              Pick at least one — these power filtering.
            </div>
          </div>
          {selectedTags.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => setValue("tags", [], { shouldDirty: true, shouldValidate: true })}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((t) => {
            const selected = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition",
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-background hover:bg-muted/60",
                ].join(" ")}
                aria-pressed={selected}
              >
                {t}
              </button>
            );
          })}
        </div>

        <ErrorText msg={errors.tags?.message as any} />

        {selectedTags.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Selected: {selectedTags.join(", ")}
          </div>
        )}
      </div>

      {/* SENSORY */}
      <div className="rounded-3xl border bg-card p-5">
        <div>
          <div className="text-sm font-semibold">Sensory environment</div>
          <div className="text-xs text-muted-foreground">
            Optional — “Not sure” is totally fine.
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-medium">Noise level</div>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={sensory?.noiseLevel ?? ""}
              onChange={(e) =>
                setValue(
                  "sensory.noiseLevel",
                  (e.target.value || undefined) as any,
                  { shouldDirty: true }
                )
              }
            >
              <option value="">Not sure</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-medium">Lighting</div>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={sensory?.lighting ?? ""}
              onChange={(e) =>
                setValue(
                  "sensory.lighting",
                  (e.target.value || undefined) as any,
                  { shouldDirty: true }
                )
              }
            >
              <option value="">Not sure</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-sm font-medium">Crowding</div>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={sensory?.crowding ?? ""}
              onChange={(e) =>
                setValue(
                  "sensory.crowding",
                  (e.target.value || undefined) as any,
                  { shouldDirty: true }
                )
              }
            >
              <option value="">Not sure</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {levelLabel(l)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!sensory?.quietSpace}
              onCheckedChange={(v) =>
                setValue("sensory.quietSpace", !!v, { shouldDirty: true })
              }
            />
            Quiet space available
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!sensory?.sensoryHours}
              onCheckedChange={(v) =>
                setValue("sensory.sensoryHours", !!v, { shouldDirty: true })
              }
            />
            Sensory hours offered
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium">Sensory notes</div>
          <Textarea
            className="min-h-20"
            placeholder="Anything helpful… (music volume, staff awareness, quiet corner, etc)"
            value={sensory?.notes ?? ""}
            onChange={(e) =>
              setValue("sensory.notes", e.target.value, { shouldDirty: true })
            }
          />
          <ErrorText msg={(errors.sensory as any)?.notes?.message} />
        </div>
      </div>

      {/* FACILITIES */}
      <div className="rounded-3xl border bg-card p-5">
        <div>
          <div className="text-sm font-semibold">Facilities</div>
          <div className="text-xs text-muted-foreground">Optional</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!facilities?.parking}
              onCheckedChange={(v) =>
                setValue("facilities.parking", !!v, { shouldDirty: true })
              }
            />
            Parking
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!facilities?.accessibleToilet}
              onCheckedChange={(v) =>
                setValue("facilities.accessibleToilet", !!v, {
                  shouldDirty: true,
                })
              }
            />
            Accessible toilet
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!facilities?.babyChange}
              onCheckedChange={(v) =>
                setValue("facilities.babyChange", !!v, { shouldDirty: true })
              }
            />
            Baby changing
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!facilities?.wheelchairAccess}
              onCheckedChange={(v) =>
                setValue("facilities.wheelchairAccess", !!v, {
                  shouldDirty: true,
                })
              }
            />
            Wheelchair access
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!facilities?.staffTrained}
              onCheckedChange={(v) =>
                setValue("facilities.staffTrained", !!v, { shouldDirty: true })
              }
            />
            Staff trained / supportive
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium">Facilities notes</div>
          <Textarea
            className="min-h-20"
            placeholder="Any extra details…"
            value={facilities?.notes ?? ""}
            onChange={(e) =>
              setValue("facilities.notes", e.target.value, { shouldDirty: true })
            }
          />
          <ErrorText msg={(errors.facilities as any)?.notes?.message} />
        </div>
      </div>

      {serverError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Submitting…" : "Submit venue"}
      </Button>

      <div className="text-xs text-muted-foreground">
        Tip: upload images first, then submit — the URLs are included in the
        payload automatically.
      </div>
    </form>
  );
}
