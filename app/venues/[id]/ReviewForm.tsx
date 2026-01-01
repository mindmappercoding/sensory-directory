"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Star, LogIn, LogOut, Pencil } from "lucide-react";

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

import { signIn, signOut, useSession } from "next-auth/react";

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

type MyReview = {
  id: string;
  authorName: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  visitTimeHint: string | null;
  noiseLevel: Level | null;
  lighting: Level | null;
  crowding: Level | null;
  quietSpace: boolean | null;
  sensoryHours: boolean | null;
};

export function ReviewForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const { data, status } = useSession();
  const authed = status === "authenticated";
  const signedInLabel = data?.user?.name || data?.user?.email || "Signed in";

  // Collapsible state
  const [open, setOpen] = React.useState(false);

  // Existing review (if any)
  const [myReview, setMyReview] = React.useState<MyReview | null>(null);
  const [loadingMine, setLoadingMine] = React.useState(false);

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

  // If user signs out while open, close it + reset "myReview"
  React.useEffect(() => {
    if (!authed) {
      setOpen(false);
      setMyReview(null);
    }
  }, [authed]);

  function handleSignIn() {
    const callbackUrl =
      typeof window !== "undefined" ? window.location.href : undefined;

    signIn("google", callbackUrl ? { callbackUrl } : undefined);
  }

  // Load the signed-in user's existing review for this venue
  React.useEffect(() => {
    if (!authed) return;

    let cancelled = false;
    setLoadingMine(true);

    fetch(`/api/venues/${venueId}/reviews`, { method: "GET" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const r = data?.review as MyReview | null;

        setMyReview(r ?? null);

        // If they already have a review, prefill form
        if (r) {
          setForm({
            authorName: r.authorName ?? "",
            rating: String(r.rating ?? 5),
            title: r.title ?? "",
            content: r.content ?? "",
            visitTimeHint: r.visitTimeHint ?? "",
            noiseLevel: (r.noiseLevel ?? "") as Level,
            lighting: (r.lighting ?? "") as Level,
            crowding: (r.crowding ?? "") as Level,
            quietSpace: Boolean(r.quietSpace),
            sensoryHours: Boolean(r.sensoryHours),
          });
        } else {
          // Otherwise optionally fill name from session (still editable)
          const name = (data?.user?.name || "")?.trim();
          if (name) {
            setForm((p) => (p.authorName ? p : { ...p, authorName: name }));
          }
        }
      })
      .catch(() => {
        if (!cancelled) setMyReview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authed, venueId]);

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

    if (!authed) {
      toast.error("Please sign in to leave a review.");
      handleSignIn();
      return;
    }

    startTransition(async () => {
      const isEditing = Boolean(myReview?.id);
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(`/api/venues/${venueId}/reviews`, {
        method,
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
        toast.error(data?.error ?? "Could not save review");
        return;
      }

      toast.success(isEditing ? "Review updated" : "Review submitted", {
        description: "Thanks for sharing — this helps other parents a lot 💙",
      });

      setOpen(false);
      router.refresh();
    });
  }

  const isEditing = Boolean(myReview?.id);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border/40 overflow-hidden">
        {/* Header (always visible) */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Star className="h-4 w-4 text-primary" />
              {isEditing ? "Your review" : "Leave a review"}
              {loadingMine && authed ? (
                <span className="text-xs text-muted-foreground font-normal">
                  (checking…)
                </span>
              ) : null}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {authed ? (
                <>
                  <span>
                    Signed in as{" "}
                    <span className="font-medium">{signedInLabel}</span>
                  </span>
                  {isEditing ? (
                    <span className="rounded-full px-2 py-0.5 bg-muted ring-1 ring-border/40">
                      You can edit your review
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ring-border/50 hover:bg-muted"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </>
              ) : (
                <span>Sign in to open the review form.</span>
              )}
            </div>
          </div>

          {/* Right-side button */}
          {authed ? (
            <CollapsibleTrigger asChild>
              <Button
                variant={open ? "secondary" : "default"}
                className="rounded-2xl"
              >
                {open
                  ? "Hide"
                  : isEditing
                  ? "Edit your review"
                  : "Write a review"}
                {isEditing && !open ? (
                  <Pencil className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <Button onClick={handleSignIn} className="rounded-2xl">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to review
            </Button>
          )}
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

                <Button type="submit" disabled={pending || !authed} className="rounded-2xl">
                  {pending ? "Saving..." : isEditing ? "Update review" : "Submit review"}
                </Button>
              </div>
            </form>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
