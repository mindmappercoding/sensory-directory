"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const TAGS = [
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

type FieldErrors = Record<string, string[]>;

function firstErr(errors: FieldErrors | null, key: string) {
  const msg = errors?.[key]?.[0];
  return msg ? String(msg) : null;
}

export default function SubmitVenueForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    proposedName: "",
    website: "",
    phone: "",
    description: "",
    address1: "",
    address2: "",
    city: "",
    postcode: "",
    county: "",
    tags: [] as string[],

    // sensory
    noiseLevel: "" as "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    lighting: "" as "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    crowding: "" as "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH",
    quietSpace: false,
    sensoryHours: false,
    sensoryNotes: "",

    // facilities
    parking: false,
    accessibleToilet: false,
    babyChange: false,
    wheelchairAccess: false,
    staffTrained: false,
    facilitiesNotes: "",
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

  function CheckboxRow({ label, checked, onChange }: any) {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onChange(Boolean(v))}
        />
        {label}
      </label>
    );
  }

  function toggleTag(tag: string) {
    setForm((p) => ({
      ...p,
      tags: p.tags.includes(tag)
        ? p.tags.filter((t) => t !== tag)
        : [...p.tags, tag],
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors(null);
    setOkMsg(null);

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "NEW_VENUE",
        proposedName: form.proposedName,
        payload: {
          website: form.website || undefined,
          phone: form.phone || undefined,
          description: form.description || undefined,
          address1: form.address1 || undefined,
          address2: form.address2 || undefined,
          city: form.city,
          postcode: form.postcode,
          county: form.county || undefined,
          tags: form.tags,

          sensory: {
            noiseLevel: form.noiseLevel || undefined,
            lighting: form.lighting || undefined,
            crowding: form.crowding || undefined,
            quietSpace: form.quietSpace,
            sensoryHours: form.sensoryHours,
            notes: form.sensoryNotes || undefined,
          },

          facilities: {
            parking: form.parking,
            accessibleToilet: form.accessibleToilet,
            babyChange: form.babyChange,
            wheelchairAccess: form.wheelchairAccess,
            staffTrained: form.staffTrained,
            notes: form.facilitiesNotes || undefined,
          },
        },
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setPending(false);

      // ✅ Expect: { error: string, issues?: { fieldErrors?: Record<string, string[]> } }
      setFormError(data?.error ?? "Something went wrong.");

      const fe: FieldErrors | null = data?.issues?.fieldErrors ?? null;
      if (fe) setFieldErrors(fe);

      return;
    }

    setPending(false);
    toast.success("Venue submitted for review", {
      description: "Thanks for helping build the sensory directory 💙",
    });
    setTimeout(() => router.push("/venues"), 900);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {formError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Venue name *</Label>
        <Input
          id="name"
          value={form.proposedName}
          onChange={(e) =>
            setForm((p) => ({ ...p, proposedName: e.target.value }))
          }
          placeholder="e.g. Calm Kids Soft Play"
          required
          aria-invalid={!!firstErr(fieldErrors, "proposedName")}
        />
        {firstErr(fieldErrors, "proposedName") && (
          <p className="text-sm text-destructive">
            {firstErr(fieldErrors, "proposedName")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) =>
              setForm((p) => ({ ...p, website: e.target.value }))
            }
            placeholder="https://..."
            aria-invalid={!!firstErr(fieldErrors, "website")}
          />
          {firstErr(fieldErrors, "website") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "website")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Optional"
            aria-invalid={!!firstErr(fieldErrors, "phone")}
          />
          {firstErr(fieldErrors, "phone") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "phone")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Short description</Label>
        <Textarea
          id="desc"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="What makes it good for sensory needs?"
          aria-invalid={!!firstErr(fieldErrors, "description")}
        />
        {firstErr(fieldErrors, "description") && (
          <p className="text-sm text-destructive">
            {firstErr(fieldErrors, "description")}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="e.g. Leeds"
            aria-invalid={!!firstErr(fieldErrors, "city")}
          />
          {firstErr(fieldErrors, "city") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "city")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            value={form.postcode}
            onChange={(e) =>
              setForm((p) => ({ ...p, postcode: e.target.value }))
            }
            placeholder="e.g. LS1 2AB"
            aria-invalid={!!firstErr(fieldErrors, "postcode")}
          />
          {firstErr(fieldErrors, "postcode") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "postcode")}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address1">Address line 1</Label>
          <Input
            id="address1"
            value={form.address1}
            onChange={(e) =>
              setForm((p) => ({ ...p, address1: e.target.value }))
            }
            aria-invalid={!!firstErr(fieldErrors, "address1")}
          />
          {firstErr(fieldErrors, "address1") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "address1")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address2">Address line 2</Label>
          <Input
            id="address2"
            value={form.address2}
            onChange={(e) =>
              setForm((p) => ({ ...p, address2: e.target.value }))
            }
            aria-invalid={!!firstErr(fieldErrors, "address2")}
          />
          {firstErr(fieldErrors, "address2") && (
            <p className="text-sm text-destructive">
              {firstErr(fieldErrors, "address2")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="county">County</Label>
        <Input
          id="county"
          value={form.county}
          onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))}
          placeholder="e.g. West Yorkshire"
        />
      </div>

      <h3 className="text-lg font-medium">Sensory environment</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        <SensorySelect
          label="Noise level"
          value={form.noiseLevel}
          onChange={(v) => setForm((p) => ({ ...p, noiseLevel: v as any }))}
        />
        <SensorySelect
          label="Lighting"
          value={form.lighting}
          onChange={(v) => setForm((p) => ({ ...p, lighting: v as any }))}
        />
        <SensorySelect
          label="Crowding"
          value={form.crowding}
          onChange={(v) => setForm((p) => ({ ...p, crowding: v as any }))}
        />
      </div>

      <h3 className="text-lg font-medium">Facilities</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxRow
          label="Parking available"
          checked={form.parking}
          onChange={(v: any) => setForm((p) => ({ ...p, parking: v }))}
        />
        <CheckboxRow
          label="Accessible toilet"
          checked={form.accessibleToilet}
          onChange={(v: any) => setForm((p) => ({ ...p, accessibleToilet: v }))}
        />
        <CheckboxRow
          label="Baby changing"
          checked={form.babyChange}
          onChange={(v: any) => setForm((p) => ({ ...p, babyChange: v }))}
        />
        <CheckboxRow
          label="Wheelchair access"
          checked={form.wheelchairAccess}
          onChange={(v: any) => setForm((p) => ({ ...p, wheelchairAccess: v }))}
        />
        <CheckboxRow
          label="Staff trained in SEN"
          checked={form.staffTrained}
          onChange={(v: any) => setForm((p) => ({ ...p, staffTrained: v }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Button
              key={t}
              type="button"
              variant={form.tags.includes(t) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        {firstErr(fieldErrors, "tags") && (
          <p className="text-sm text-destructive">
            {firstErr(fieldErrors, "tags")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Pick a few that help parents filter quickly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.sensoryHours}
            onCheckedChange={(v) =>
              setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))
            }
          />
          Has sensory hours
        </label>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.quietSpace}
            onCheckedChange={(v) =>
              setForm((p) => ({ ...p, quietSpace: Boolean(v) }))
            }
          />
          Has a quiet space
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Extra sensory notes</Label>
        <Textarea
          id="notes"
          value={form.sensoryNotes}
          onChange={(e) =>
            setForm((p) => ({ ...p, sensoryNotes: e.target.value }))
          }
          placeholder="Anything that would reduce anxiety for parents? (queues, staff understanding, lighting, noise, etc)"
          aria-invalid={!!firstErr(fieldErrors, "sensory.notes")}
        />
        {/* sensory.* errors may come back nested; simplest is show a generic sensory error if present */}
        {firstErr(fieldErrors, "sensory") && (
          <p className="text-sm text-destructive">
            {firstErr(fieldErrors, "sensory")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit for review"}
      </Button>
    </form>
  );
}
