"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  // Collapsible state
  const [open, setOpen] = React.useState(false);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors | null>(
    null
  );

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
    const err = firstErr(fieldErrors, fieldKey);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <select
          className={[
            "w-full rounded-xl bg-background px-3 py-2 text-sm",
            "ring-1 ring-border/40 focus:outline-none focus:ring-2 focus:ring-ring",
            err ? "ring-destructive/50 focus:ring-destructive" : "",
          ].join(" ")}
          value={value}
          onChange={(e) => onChange(e.target.value as Level)}
          aria-invalid={!!err}
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        {err && <p className="text-sm text-destructive">{err}</p>}
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

      toast.success("Review submitted", {
        description: "Thanks for sharing — this helps other parents a lot 💙",
      });

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

      // Close the form after submit (optional)
      setOpen(false);

      // Refresh the server-rendered page so the new review appears
      router.refresh();
    });
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border/40 overflow-hidden">
        {/* Header (always visible) */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" />
              Leave a review
            </div>
            <div className="text-xs text-muted-foreground">
              {open
                ? "Share what it was like — this really helps other families."
                : "Tap to open the review form"}
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant={open ? "secondary" : "default"}
              className="rounded-2xl"
            >
              {open ? "Hide" : "Write a review"}
              <ChevronDown
                className={`ml-2 h-4 w-4 transition ${
                  open ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Form (collapsible content) */}
        <CollapsibleContent>
          <div className="px-4 pb-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive ring-1 ring-destructive/20">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="author">Your name (optional)</Label>
                  <Input
                    id="author"
                    value={form.authorName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, authorName: e.target.value }))
                    }
                    placeholder="e.g. Sarah"
                  />
                  {firstErr(fieldErrors, "authorName") && (
                    <p className="text-sm text-destructive">
                      {firstErr(fieldErrors, "authorName")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating *</Label>
                  <select
                    id="rating"
                    className={[
                      "w-full rounded-xl bg-background px-3 py-2 text-sm",
                      "ring-1 ring-border/40 focus:outline-none focus:ring-2 focus:ring-ring",
                      firstErr(fieldErrors, "rating")
                        ? "ring-destructive/50 focus:ring-destructive"
                        : "",
                    ].join(" ")}
                    value={form.rating}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rating: e.target.value }))
                    }
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - OK</option>
                    <option value="2">2 - Not great</option>
                    <option value="1">1 - Bad</option>
                  </select>
                  {firstErr(fieldErrors, "rating") && (
                    <p className="text-sm text-destructive">
                      {firstErr(fieldErrors, "rating")}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Short summary"
                    aria-invalid={!!firstErr(fieldErrors, "title")}
                  />
                  {firstErr(fieldErrors, "title") && (
                    <p className="text-sm text-destructive">
                      {firstErr(fieldErrors, "title")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visit">Visit time (optional)</Label>
                  <Input
                    id="visit"
                    value={form.visitTimeHint}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, visitTimeHint: e.target.value }))
                    }
                    placeholder="e.g. weekday morning"
                    aria-invalid={!!firstErr(fieldErrors, "visitTimeHint")}
                  />
                  {firstErr(fieldErrors, "visitTimeHint") && (
                    <p className="text-sm text-destructive">
                      {firstErr(fieldErrors, "visitTimeHint")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Review (optional)</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="What was it like? Any tips for parents?"
                  aria-invalid={!!firstErr(fieldErrors, "content")}
                />
                {firstErr(fieldErrors, "content") && (
                  <p className="text-sm text-destructive">
                    {firstErr(fieldErrors, "content")}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">
                  Sensory signals (optional)
                </h3>

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
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, quietSpace: Boolean(v) }))
                      }
                    />
                    Quiet space available
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.sensoryHours}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))
                      }
                    />
                    Sensory hours offered
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-xs text-muted-foreground">
                  Reviews help other families choose confidently.
                </p>

                <Button type="submit" disabled={pending} className="rounded-2xl">
                  {pending ? "Submitting..." : "Submit review"}
                </Button>
              </div>
            </form>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
