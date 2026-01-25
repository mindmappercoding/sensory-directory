"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUploader from "@/app/submit/imageUploader";
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
  X,
  ImageIcon,
} from "lucide-react";

type SensoryLevel = "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export default function AdminVenueEditForm({ venue }: { venue: any }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [form, setForm] = React.useState({
    name: venue.name ?? "",
    description: venue.description ?? "",
    website: venue.website ?? "",
    phone: venue.phone ?? "",

    address1: venue.address1 ?? "",
    address2: venue.address2 ?? "",
    city: venue.city ?? "",
    postcode: venue.postcode ?? "",
    county: venue.county ?? "",

    tags: Array.isArray(venue.tags) ? venue.tags.join(", ") : "",

    coverImageUrl: venue.coverImageUrl ?? "",
    imageUrls: Array.isArray(venue.imageUrls) ? venue.imageUrls : [],

    noiseLevel: (venue.sensory?.noiseLevel ?? "") as SensoryLevel,
    lighting: (venue.sensory?.lighting ?? "") as SensoryLevel,
    crowding: (venue.sensory?.crowding ?? "") as SensoryLevel,
    quietSpace: Boolean(venue.sensory?.quietSpace ?? false),
    sensoryHours: Boolean(venue.sensory?.sensoryHours ?? false),
    sensoryNotes: venue.sensory?.notes ?? "",

    parking: Boolean(venue.facilities?.parking ?? false),
    accessibleToilet: Boolean(venue.facilities?.accessibleToilet ?? false),
    babyChange: Boolean(venue.facilities?.babyChange ?? false),
    wheelchairAccess: Boolean(venue.facilities?.wheelchairAccess ?? false),
    staffTrained: Boolean(venue.facilities?.staffTrained ?? false),
    facilitiesNotes: venue.facilities?.notes ?? "",
  });

  function SensorySelect({
    label,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    icon: any;
  }) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </Label>
        <select
          className="w-full rounded-2xl border bg-background px-4 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Not specified</option>
          <option value="VERY_LOW">Very low</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="VERY_HIGH">Very high</option>
        </select>
      </div>
    );
  }

  function removeGalleryImage(url: string) {
    setForm((p) => ({
      ...p,
      imageUrls: (p.imageUrls ?? []).filter((u: string) => u !== url),
    }));
  }

  function clearCover() {
    setForm((p) => ({ ...p, coverImageUrl: "" }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const tags = form.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/venues/${venue.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          website: form.website || null,
          phone: form.phone || null,

          address1: form.address1 || null,
          address2: form.address2 || null,
          city: form.city || null,
          postcode: form.postcode || null,
          county: form.county || null,

          tags,

          coverImageUrl: form.coverImageUrl || null,
          imageUrls: uniq(form.imageUrls ?? []),

          sensory: {
            noiseLevel: form.noiseLevel || null,
            lighting: form.lighting || null,
            crowding: form.crowding || null,
            quietSpace: form.quietSpace,
            sensoryHours: form.sensoryHours,
            notes: form.sensoryNotes || null,
          },

          facilities: {
            parking: form.parking,
            accessibleToilet: form.accessibleToilet,
            babyChange: form.babyChange,
            wheelchairAccess: form.wheelchairAccess,
            staffTrained: form.staffTrained,
            notes: form.facilitiesNotes || null,
          },
        }),
      });

      if (!res.ok) {
        toast.error("Could not save changes");
        return;
      }

      toast.success("Venue updated");
      router.refresh();
    });
  }

  const cover = form.coverImageUrl || "/600x400.png";
  const gallery = uniq(form.imageUrls ?? []);

  return (
    <form onSubmit={onSave} className="space-y-6">
      {/* Images Section */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Images</h3>
            <p className="text-sm text-muted-foreground">
              Upload or manage venue images. Click Save changes to persist.
            </p>
          </div>
        </div>

        {/* Current Cover */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Current cover</Label>
            {!!form.coverImageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCover}
                className="rounded-2xl"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Remove cover
              </Button>
            )}
          </div>

          <div className="relative h-48 w-full overflow-hidden rounded-2xl border">
            <Image
              src={cover}
              alt="Cover"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <div className="break-all rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
            {form.coverImageUrl
              ? form.coverImageUrl
              : "No cover set (fallback used)."}
          </div>
        </div>

        {/* Current Gallery */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Current gallery ({gallery.length})
          </Label>

          {gallery.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No gallery images yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((src) => (
                <div
                  key={src}
                  className="group relative overflow-hidden rounded-2xl border bg-background"
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={src}
                      alt="Gallery image"
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(src)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border bg-background/90 opacity-0 shadow-sm transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload More */}
        <ImageUploader
          onChange={(next) => {
            setForm((p) => ({
              ...p,
              coverImageUrl: next.coverImageUrl ?? p.coverImageUrl,
              imageUrls: uniq([...(p.imageUrls ?? []), ...(next.imageUrls ?? [])]),
            }));
            toast.success("Images uploaded (now click Save changes)");
          }}
        />

        <div className="rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground">
          After saving: cover = {form.coverImageUrl ? "set" : "none"}, gallery ={" "}
          {gallery.length} image(s)
        </div>
      </div>

      {/* Venue Details */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Venue Details</h3>
            <p className="text-sm text-muted-foreground">
              Basic information about the venue
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="min-h-[120px] rounded-2xl"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Website
              </Label>
              <Input
                value={form.website}
                onChange={(e) =>
                  setForm((p) => ({ ...p, website: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Address</h3>
            <p className="text-sm text-muted-foreground">Location details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Address 1</Label>
              <Input
                value={form.address1}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address1: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Address 2</Label>
              <Input
                value={form.address2}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address2: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input
                value={form.postcode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, postcode: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label>County</Label>
              <Input
                value={form.county}
                onChange={(e) =>
                  setForm((p) => ({ ...p, county: e.target.value }))
                }
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Tags</h3>
            <p className="text-sm text-muted-foreground">
              Comma-separated (e.g., park, outdoor, family)
            </p>
          </div>
        </div>

        <Input
          value={form.tags}
          onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          className="rounded-2xl"
          placeholder="park, outdoor, family"
        />
      </div>

      {/* Sensory */}
      <div className="space-y-4 rounded-3xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Sensory Environment</h3>
            <p className="text-sm text-muted-foreground">
              Environmental sensory information
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SensorySelect
            label="Noise"
            value={form.noiseLevel}
            onChange={(v) => setForm((p) => ({ ...p, noiseLevel: v as any }))}
            icon={Volume2}
          />
          <SensorySelect
            label="Lighting"
            value={form.lighting}
            onChange={(v) => setForm((p) => ({ ...p, lighting: v as any }))}
            icon={Sun}
          />
          <SensorySelect
            label="Crowding"
            value={form.crowding}
            onChange={(v) => setForm((p) => ({ ...p, crowding: v as any }))}
            icon={Users}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm transition-colors hover:bg-background">
            <Checkbox
              checked={form.sensoryHours}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Has sensory hours
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-4 text-sm transition-colors hover:bg-background">
            <Checkbox
              checked={form.quietSpace}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, quietSpace: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              Has a quiet space
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <Label>Sensory notes</Label>
          <Textarea
            value={form.sensoryNotes}
            onChange={(e) =>
              setForm((p) => ({ ...p, sensoryNotes: e.target.value }))
            }
            className="min-h-20 rounded-2xl"
          />
        </div>
      </div>

      {/* Facilities */}
      <div className="space-y-4 rounded-3xl border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Accessibility className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Facilities</h3>
            <p className="text-sm text-muted-foreground">
              Available facilities and amenities
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={form.parking}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, parking: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              Parking
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={form.accessibleToilet}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, accessibleToilet: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Accessible toilet
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={form.babyChange}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, babyChange: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Baby className="h-3.5 w-3.5 text-muted-foreground" />
              Baby change
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={form.wheelchairAccess}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, wheelchairAccess: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <Accessibility className="h-3.5 w-3.5 text-muted-foreground" />
              Wheelchair access
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-muted/30 p-4 text-sm transition-colors hover:bg-muted/50">
            <Checkbox
              checked={form.staffTrained}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, staffTrained: Boolean(v) }))
              }
            />
            <span className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              Staff trained
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <Label>Facilities notes</Label>
          <Textarea
            value={form.facilitiesNotes}
            onChange={(e) =>
              setForm((p) => ({ ...p, facilitiesNotes: e.target.value }))
            }
            className="min-h-20 rounded-2xl"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="rounded-2xl bg-muted/50 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            💙 Changes will be saved to the live venue
          </p>
          <Button
            type="submit"
            disabled={pending}
            size="lg"
            className="rounded-2xl"
          >
            {pending ? (
              <>
                <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}