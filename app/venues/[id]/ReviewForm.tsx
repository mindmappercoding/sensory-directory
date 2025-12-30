"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type FieldErrors = Record<string, string[]>;

function firstErr(errors: FieldErrors | null, key: string) {
  const msg = errors?.[key]?.[0];
  return msg ? String(msg) : null;
}

const LEVELS = [
  { value: "", label: "Not specified" },
  { value: "VERY_LOW", label: "Very low" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "VERY_HIGH", label: "Very high" },
] as const;

type Level = "" | "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export function ReviewForm({ venueId }: { venueId: string }) {
  const [pending, startTransition] = React.useTransition();

  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors | null>(null);

  const [form, setForm] = React.useState({
    authorName: "",
    rating: "5",
    title: "",
    content: "",
    visitTimeHint: "",

    noiseLevel: "" as Level,
    lighting: "" as Level,
    crowding: "" as Level,
    quietSpace: false,
    sensoryHours: false,
  });

  function LevelSelect({
    label,
    value,
    onChange,
    fieldKey,
  }: {
    label: string;
    value: Level;
    onChange: (v: Level) => void;
    fieldKey: string;
  }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <select
          className={[
            "w-full rounded-md border bg-background px-3 py-2 text-sm",
            firstErr(fieldErrors, fieldKey) ? "border-destructive" : "",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value as Level)}
        >
          {LEVELS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {firstErr(fieldErrors, fieldKey) && (
          <p className="text-sm text-destructive">{firstErr(fieldErrors, fieldKey)}</p>
        )}
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    startTransition(async () => {
      const res = await fetch(`/api/venues/${venueId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: form.authorName || undefined,
          rating: Number(form.rating),
          title: form.title || undefined,
          content: form.content || undefined,
          visitTimeHint: form.visitTimeHint || undefined,

          noiseLevel: form.noiseLevel || undefined,
          lighting: form.lighting || undefined,
          crowding: form.crowding || undefined,
          quietSpace: form.quietSpace,
          sensoryHours: form.sensoryHours,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(data?.error ?? "Something went wrong.");
        const fe: FieldErrors | null = data?.issues?.fieldErrors ?? null;
        if (fe) setFieldErrors(fe);
        toast.error(data?.error ?? "Could not submit review");
        return;
      }

      toast.success("Review submitted", { description: "Thanks for sharing — this helps other parents a lot 💙" });

      // Reset (keep authorName if you want; I’m resetting everything)
      setForm({
        authorName: "",
        rating: "5",
        title: "",
        content: "",
        visitTimeHint: "",
        noiseLevel: "",
        lighting: "",
        crowding: "",
        quietSpace: false,
        sensoryHours: false,
      });

      // Refresh the server-rendered page so the new review appears
      // (works in Next 15/16 App Router)
      window.location.reload();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border p-4 space-y-4">
      {formError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {formError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Your name (optional)</Label>
          <Input
            id="author"
            value={form.authorName}
            onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
            placeholder="e.g. Sarah"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating *</Label>
          <select
            id="rating"
            className={[
              "w-full rounded-md border bg-background px-3 py-2 text-sm",
              firstErr(fieldErrors, "rating") ? "border-destructive" : "",
            ].join(" ")}
            value={form.rating}
            onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - OK</option>
            <option value="2">2 - Not great</option>
            <option value="1">1 - Bad</option>
          </select>
          {firstErr(fieldErrors, "rating") && (
            <p className="text-sm text-destructive">{firstErr(fieldErrors, "rating")}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title (optional)</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Short summary"
            aria-invalid={!!firstErr(fieldErrors, "title")}
          />
          {firstErr(fieldErrors, "title") && (
            <p className="text-sm text-destructive">{firstErr(fieldErrors, "title")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="visit">Visit time (optional)</Label>
          <Input
            id="visit"
            value={form.visitTimeHint}
            onChange={(e) => setForm((p) => ({ ...p, visitTimeHint: e.target.value }))}
            placeholder="e.g. weekday morning"
            aria-invalid={!!firstErr(fieldErrors, "visitTimeHint")}
          />
          {firstErr(fieldErrors, "visitTimeHint") && (
            <p className="text-sm text-destructive">{firstErr(fieldErrors, "visitTimeHint")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Review (optional)</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          placeholder="What was it like? Any tips for parents?"
          aria-invalid={!!firstErr(fieldErrors, "content")}
        />
        {firstErr(fieldErrors, "content") && (
          <p className="text-sm text-destructive">{firstErr(fieldErrors, "content")}</p>
        )}
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium mb-3">Sensory signals (optional)</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <LevelSelect
            label="Noise"
            value={form.noiseLevel}
            onChange={(v) => setForm((p) => ({ ...p, noiseLevel: v }))}
            fieldKey="noiseLevel"
          />
          <LevelSelect
            label="Lighting"
            value={form.lighting}
            onChange={(v) => setForm((p) => ({ ...p, lighting: v }))}
            fieldKey="lighting"
          />
          <LevelSelect
            label="Crowding"
            value={form.crowding}
            onChange={(v) => setForm((p) => ({ ...p, crowding: v }))}
            fieldKey="crowding"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.quietSpace}
              onCheckedChange={(v) => setForm((p) => ({ ...p, quietSpace: Boolean(v) }))}
            />
            Quiet space available
          </label>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sensoryHours}
              onCheckedChange={(v) => setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))}
            />
            Sensory hours offered
          </label>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
