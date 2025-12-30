"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type SensoryLevel = "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

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

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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
        <Textarea
          value={form.sensoryNotes}
          onChange={(e) => setForm((p) => ({ ...p, sensoryNotes: e.target.value }))}
        />
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
        <Textarea
          value={form.facilitiesNotes}
          onChange={(e) => setForm((p) => ({ ...p, facilitiesNotes: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
