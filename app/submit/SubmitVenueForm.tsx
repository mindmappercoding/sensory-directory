"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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
import ImageUploader, { type ImageUploaderHandle } from "./imageUploader";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Tag,
  Sparkles,
  Volume2,
  Sun,
  Users,
  Car,
  Accessibility,
  Baby,
  UserCheck,
  ImageIcon,
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
  return <div className="mt-1 text-sm text-destructive">{msg}</div>;
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

function normalizePostcode(input: unknown) {
  if (typeof input !== "string") return input as any;
  return input.toUpperCase().replace(/\s+/g, " ").trim();
}

function digitsOnly(input: unknown) {
  if (typeof input !== "string") return input as any;
  return input.replace(/\D/g, "");
}

export default function SubmitVenueForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const uploaderRef = useRef<ImageUploaderHandle | null>(null);

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
      coverImageUrl: "",
      imageUrls: [],
      sensory: {
        noiseLevel: undefined,
        lighting: undefined,
        crowding: undefined,
        quietSpace: false,
        sensoryHours: false,
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
    reset,
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

    const coverImageUrl = (getValues("coverImageUrl") ?? "").trim();
    const imageUrls = (getValues("imageUrls") ?? [])
      .map((u) => u.trim())
      .filter(Boolean);

    const payload: VenueSubmissionInput = {
      ...values,
      coverImageUrl,
      imageUrls,
      postcode: normalizePostcode(values.postcode) as any,
      phone: digitsOnly(values.phone) as any,
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
          description: "Thanks — we'll review it before it goes live.",
        });

        uploaderRef.current?.clearSelection();
        reset();
      } catch (e: any) {
        const msg = e?.message ?? "Server error";
        setServerError(msg);
        toast.error(msg);
      }
    });
  }

  async function handleFullSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    setServerError(null);

    const ref = uploaderRef.current;

    if (ref?.hasQueuedFiles()) {
      setUploadingImages(true);
      const t = toast.loading("Uploading photos…");
      try {
        const out = await ref.upload();
        if (!out) {
          toast.error("Upload failed. Please try again.");
          return;
        }

        toast.success("Images uploaded", {
          description: "They'll be included in your submission.",
        });
      } finally {
        setUploadingImages(false);
        toast.dismiss(t);
      }
    }

    const coverUrl = (getValues("coverImageUrl") ?? "").trim();
    const galleryUrls = (getValues("imageUrls") ?? []).filter(Boolean);

    if (!coverUrl || galleryUrls.length === 0) {
      toast.error("Please upload photos before submitting.", {
        description: "Add a cover photo and at least 1 gallery image.",
      });

      ref?.openCoverPicker();
      return;
    }

    return handleSubmit(onSubmit)();
  }

  return (
    <form onSubmit={handleFullSubmit} className="space-y-6">
      {/* IMAGES */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Photos *</h3>
            <p className="text-sm text-muted-foreground">
              Add a cover image and gallery photos. Images upload when you submit.
            </p>
          </div>
        </div>

        <ImageUploader
          ref={uploaderRef}
          mode="deferred"
          disabled={isPending || uploadingImages}
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

            const merged = uniq([...prevGallery, ...(next.imageUrls ?? [])]).slice(
              0,
              10
            );
            setValue("imageUrls", merged, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
        />
        <ErrorText msg={errors.coverImageUrl?.message as any} />
        <ErrorText msg={errors.imageUrls?.message as any} />
      </div>

      {/* VENUE DETAILS */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Venue details *</h3>
            <p className="text-sm text-muted-foreground">
              Basic information about the venue
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Venue name *</label>
            <Input
              placeholder="e.g. Calm Kids Soft Play"
              className="rounded-2xl"
              {...register("proposedName", {
                setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
              })}
            />
            <ErrorText msg={errors.proposedName?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="What makes it good for sensory needs? Share details about the atmosphere, activities, or special features..."
              className="min-h-[120px] rounded-2xl"
              {...register("description", {
                setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
              })}
            />
            <ErrorText msg={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Website *
              </label>
              <Input
                placeholder="https://example.com"
                className="rounded-2xl"
                {...register("website", {
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
              <ErrorText msg={errors.website?.message as any} />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone *
              </label>
              <Input
                placeholder="Digits only (e.g. 01943000000)"
                inputMode="numeric"
                pattern="\d*"
                className="rounded-2xl"
                {...register("phone", { setValueAs: digitsOnly })}
              />
              <ErrorText msg={errors.phone?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* ADDRESS */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Address *</h3>
            <p className="text-sm text-muted-foreground">
              Full location details
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Address line 1 *</label>
              <Input
                placeholder="e.g. 12 Example Road"
                className="rounded-2xl"
                {...register("address1", {
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
              <ErrorText msg={errors.address1?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address line 2 *</label>
              <Input
                placeholder="e.g. Area / district"
                className="rounded-2xl"
                {...register("address2", {
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
              <ErrorText msg={errors.address2?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">City *</label>
              <Input
                placeholder="e.g. Otley"
                className="rounded-2xl"
                {...register("city", {
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
              <ErrorText msg={errors.city?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Postcode *</label>
              <Input
                placeholder="e.g. LS21 3AB"
                className="rounded-2xl"
                {...register("postcode", { setValueAs: normalizePostcode })}
              />
              <ErrorText msg={errors.postcode?.message} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">County *</label>
              <Input
                placeholder="e.g. West Yorkshire"
                className="rounded-2xl"
                {...register("county", {
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
              <ErrorText msg={errors.county?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* TAGS */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Tags *</h3>
              <p className="text-sm text-muted-foreground">
                Pick at least one — these power search filters
              </p>
            </div>
          </div>
          {selectedTags.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-2xl"
              onClick={() =>
                setValue("tags", [], { shouldDirty: true, shouldValidate: true })
              }
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
                onClick={() => toggleTag(t)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border bg-background hover:border-primary/50 hover:bg-primary/5",
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
          <div className="rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
            Selected: {selectedTags.join(", ")}
          </div>
        )}
      </div>

      {/* SENSORY */}
      <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Sensory environment *</h3>
            <p className="text-sm text-muted-foreground">
              Required — pick the closest match for each
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              Noise level *
            </label>
            <select
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={sensory?.noiseLevel ?? ""}
              onChange={(e) =>
                setValue(
                  "sensory.noiseLevel",
                  (e.target.value || undefined) as any,
                  { shouldDirty: true, shouldValidate: true }
                )
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

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Lighting *
            </label>
            <select
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={sensory?.lighting ?? ""}
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

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              Crowding *
            </label>
            <select
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={sensory?.crowding ?? ""}
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
          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm transition-colors hover:bg-background">
            <Checkbox
              checked={!!sensory?.quietSpace}
              onCheckedChange={(v) =>
                setValue("sensory.quietSpace", !!v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              Quiet space available
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm transition-colors hover:bg-background">
            <Checkbox
              checked={!!sensory?.sensoryHours}
              onCheckedChange={(v) =>
                setValue("sensory.sensoryHours", !!v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Sensory hours offered
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sensory notes</label>
          <Textarea
            className="min-h-20 rounded-2xl"
            placeholder="Optional… (music volume, staff awareness, quiet corner, etc)"
            value={sensory?.notes ?? ""}
            onChange={(e) =>
              setValue("sensory.notes", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <ErrorText msg={(errors.sensory as any)?.notes?.message} />
        </div>
      </div>

      {/* FACILITIES */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Accessibility className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Facilities</h3>
            <p className="text-sm text-muted-foreground">Optional information</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
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

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
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

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={!!facilities?.babyChange}
              onCheckedChange={(v) =>
                setValue("facilities.babyChange", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <Baby className="h-3.5 w-3.5 text-muted-foreground" />
              Baby changing
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
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

          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={!!facilities?.staffTrained}
              onCheckedChange={(v) =>
                setValue("facilities.staffTrained", !!v, { shouldDirty: true })
              }
            />
            <span className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Staff trained / supportive
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Facilities notes</label>
          <Textarea
            className="min-h-20 rounded-2xl"
            placeholder="Optional…"
            value={facilities?.notes ?? ""}
            onChange={(e) =>
              setValue("facilities.notes", e.target.value, { shouldDirty: true })
            }
          />
          <ErrorText msg={(errors.facilities as any)?.notes?.message} />
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium">Submission error</p>
            <p className="mt-1">{serverError}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-muted/50 p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            💙 Your submission helps families find safe, welcoming spaces
          </p>

          <Button
            type="submit"
            disabled={isPending || uploadingImages}
            size="lg"
            className="w-full rounded-2xl sm:w-auto"
          >
            {uploadingImages ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Uploading photos…
              </>
            ) : isPending ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Submitting…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Submit venue
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}