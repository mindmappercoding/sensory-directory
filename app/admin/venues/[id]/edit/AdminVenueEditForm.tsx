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

    // ✅ images
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
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
    setForm((p) => ({ ...p, imageUrls: (p.imageUrls ?? []).filter((u: string) => u !== url) }));
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

          // ✅ images
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
      {/* ✅ Images */}
      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Images</h3>
          <p className="text-sm text-muted-foreground">
            Upload more images any time. Uploading only updates the form state — click{" "}
            <span className="font-medium">Save changes</span> to persist.
          </p>
        </div>

        {/* Current cover */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Current cover</div>
            {!!form.coverImageUrl && (
              <Button type="button" variant="outline" size="sm" onClick={clearCover}>
                Remove cover
              </Button>
            )}
          </div>

          <div className="relative h-44 w-full overflow-hidden rounded-xl border">
            <Image src={cover} alt="Cover" fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>

          <div className="text-xs text-muted-foreground break-all">
            {form.coverImageUrl ? form.coverImageUrl : "No cover set (fallback used)."}
          </div>
        </div>

        {/* Current gallery */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Current gallery ({gallery.length})</div>

          {gallery.length === 0 ? (
            <div className="text-sm text-muted-foreground">No gallery images yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {gallery.map((src) => (
                <div key={src} className="group relative overflow-hidden rounded-xl border bg-background">
                  <div className="relative h-24 w-full">
                    <Image src={src} alt="Gallery image" fill className="object-cover" sizes="240px" />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(src)}
                    className="absolute right-2 top-2 rounded-md border bg-background/90 px-2 py-1 text-xs opacity-0 shadow-sm transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload more */}
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

        <div className="text-xs text-muted-foreground">
          After saving: cover = {form.coverImageUrl ? "set" : "none"}, gallery ={" "}
          {gallery.length} image(s)
        </div>
      </div>

      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Address 1</Label>
          <Input value={form.address1} onChange={(e) => setForm((p) => ({ ...p, address1: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Address 2</Label>
          <Input value={form.address2} onChange={(e) => setForm((p) => ({ ...p, address2: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Postcode</Label>
          <Input value={form.postcode} onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>County</Label>
          <Input value={form.county} onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags (comma separated)</Label>
        <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
      </div>

      <h3 className="text-lg font-medium">Sensory environment</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <SensorySelect label="Noise" value={form.noiseLevel} onChange={(v) => setForm((p) => ({ ...p, noiseLevel: v as any }))} />
        <SensorySelect label="Lighting" value={form.lighting} onChange={(v) => setForm((p) => ({ ...p, lighting: v as any }))} />
        <SensorySelect label="Crowding" value={form.crowding} onChange={(v) => setForm((p) => ({ ...p, crowding: v as any }))} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.sensoryHours} onCheckedChange={(v) => setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))} />
          Has sensory hours
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.quietSpace} onCheckedChange={(v) => setForm((p) => ({ ...p, quietSpace: Boolean(v) }))} />
          Has a quiet space
        </label>
      </div>

      <div className="space-y-2">
        <Label>Sensory notes</Label>
        <Textarea value={form.sensoryNotes} onChange={(e) => setForm((p) => ({ ...p, sensoryNotes: e.target.value }))} />
      </div>

      <h3 className="text-lg font-medium">Facilities</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.parking} onCheckedChange={(v) => setForm((p) => ({ ...p, parking: Boolean(v) }))} />
          Parking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.accessibleToilet} onCheckedChange={(v) => setForm((p) => ({ ...p, accessibleToilet: Boolean(v) }))} />
          Accessible toilet
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.babyChange} onCheckedChange={(v) => setForm((p) => ({ ...p, babyChange: Boolean(v) }))} />
          Baby change
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.wheelchairAccess} onCheckedChange={(v) => setForm((p) => ({ ...p, wheelchairAccess: Boolean(v) }))} />
          Wheelchair access
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.staffTrained} onCheckedChange={(v) => setForm((p) => ({ ...p, staffTrained: Boolean(v) }))} />
          Staff trained
        </label>
      </div>

      <div className="space-y-2">
        <Label>Facilities notes</Label>
        <Textarea value={form.facilitiesNotes} onChange={(e) => setForm((p) => ({ ...p, facilitiesNotes: e.target.value }))} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
