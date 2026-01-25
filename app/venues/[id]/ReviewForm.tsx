"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  Star,
  LogIn,
  LogOut,
  Pencil,
  Volume2,
  Sun,
  Users,
  Sparkles,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";

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

function isIsoYmdDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function todayLocalYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ReviewForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const signedInLabel =
    session?.user?.name || session?.user?.email || "Signed in";
  const sessionDisplayName =
    (session?.user?.name || session?.user?.email || "")?.toString().trim();

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

  // Auto-fill name from session
  React.useEffect(() => {
    if (!authed) return;
    if (!sessionDisplayName) return;

    setForm((p) =>
      p.authorName && p.authorName.trim().length
        ? p
        : { ...p, authorName: sessionDisplayName }
    );
  }, [authed, sessionDisplayName]);

  // If user signs out while open, close it
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

  // Load existing review
  React.useEffect(() => {
    if (!authed) return;

    let cancelled = false;
    setLoadingMine(true);

    fetch(`/api/venues/${venueId}/reviews`, { method: "GET" })
      .then((r) => r.json())
      .then((resp) => {
        if (cancelled) return;
        const r = resp?.review as MyReview | null;

        setMyReview(r ?? null);

        if (r) {
          // Prefill form from existing review
          setForm({
            authorName: r.authorName ?? "",
            rating: String(r.rating ?? 5),
            title: r.title ?? "",
            content: r.content ?? "",
            visitTimeHint: isIsoYmdDate(r.visitTimeHint)
              ? r.visitTimeHint
              : "",
            noiseLevel: (r.noiseLevel ?? "") as Level,
            lighting: (r.lighting ?? "") as Level,
            crowding: (r.crowding ?? "") as Level,
            quietSpace: Boolean(r.quietSpace),
            sensoryHours: Boolean(r.sensoryHours),
          });
        } else {
          if (sessionDisplayName) {
            setForm((p) =>
              p.authorName && p.authorName.trim().length
                ? p
                : { ...p, authorName: sessionDisplayName }
            );
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
  }, [authed, venueId, sessionDisplayName]);

  function LevelSelect({
    label,
    value,
    onChange,
    fieldKey,
    icon: Icon,
  }: {
    label: string;
    value: Level;
    onChange: (v: Level) => void;
    fieldKey: string;
    icon?: React.ElementType;
  }) {
    const err = firstErr(fieldErrors, fieldKey);
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {label}
        </Label>
        <select
          className={[
            "w-full rounded-2xl bg-background px-4 py-3 text-sm transition-all",
            "ring-1 ring-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
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

      const resp = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(resp?.error ?? "Something went wrong.");
        const fe: FieldErrors | null = resp?.issues?.fieldErrors ?? null;
        if (fe) setFieldErrors(fe);
        toast.error(resp?.error ?? "Could not save review");
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
  const maxDate = todayLocalYmd();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b bg-muted/30 p-5">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-semibold">
                {isEditing ? "Your review" : "Share your experience"}
              </h3>
              {loadingMine && authed && (
                <span className="text-xs text-muted-foreground">
                  (loading...)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {authed ? (
                <>
                  <div className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{signedInLabel}</span>
                  </div>
                  {isEditing && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <Pencil className="mr-1 inline h-3 w-3" />
                      Editable
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors hover:bg-background"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sign in to share your experience
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          {authed ? (
            <CollapsibleTrigger asChild>
              <Button
                variant={open ? "secondary" : "default"}
                size="lg"
                className="rounded-2xl"
              >
                {open ? (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4 rotate-180 transition-transform" />
                    Hide form
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit review
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" />
                        Write review
                      </>
                    )}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <Button onClick={handleSignIn} size="lg" className="rounded-2xl">
              <LogIn className="mr-2 h-4 w-4" />
              Sign in to review
            </Button>
          )}
        </div>

        {/* Form Content */}
        <CollapsibleContent>
          <div className="space-y-6 p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {formError && (
                <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/20">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-medium">Error submitting review</p>
                    <p className="mt-1">{formError}</p>
                  </div>
                </div>
              )}

              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Basic information
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="author" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Your name (optional)
                    </Label>
                    <Input
                      id="author"
                      value={form.authorName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, authorName: e.target.value }))
                      }
                      placeholder="e.g. Sarah"
                      className="rounded-2xl"
                    />
                    {firstErr(fieldErrors, "authorName") && (
                      <p className="text-sm text-destructive">
                        {firstErr(fieldErrors, "authorName")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating" className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                      Rating *
                    </Label>
                    <select
                      id="rating"
                      className={[
                        "w-full rounded-2xl bg-background px-4 py-3 text-sm transition-all",
                        "ring-1 ring-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        firstErr(fieldErrors, "rating")
                          ? "ring-destructive/50 focus:ring-destructive"
                          : "",
                      ].join(" ")}
                      value={form.rating}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, rating: e.target.value }))
                      }
                    >
                      <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                      <option value="4">⭐⭐⭐⭐ Good</option>
                      <option value="3">⭐⭐⭐ OK</option>
                      <option value="2">⭐⭐ Not great</option>
                      <option value="1">⭐ Poor</option>
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
                      placeholder="Quick summary of your visit"
                      className="rounded-2xl"
                      aria-invalid={!!firstErr(fieldErrors, "title")}
                    />
                    {firstErr(fieldErrors, "title") && (
                      <p className="text-sm text-destructive">
                        {firstErr(fieldErrors, "title")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visit" className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Visit date (optional)
                    </Label>
                    <Input
                      id="visit"
                      type="date"
                      value={form.visitTimeHint}
                      max={maxDate}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          visitTimeHint: e.target.value,
                        }))
                      }
                      className="rounded-2xl"
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
                  <Label htmlFor="content">Your review (optional)</Label>
                  <Textarea
                    id="content"
                    value={form.content}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, content: e.target.value }))
                    }
                    placeholder="What was it like? Any tips for other parents?"
                    className="min-h-[120px] rounded-2xl"
                    aria-invalid={!!firstErr(fieldErrors, "content")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Share details about your experience to help other families
                  </p>
                  {firstErr(fieldErrors, "content") && (
                    <p className="text-sm text-destructive">
                      {firstErr(fieldErrors, "content")}
                    </p>
                  )}
                </div>
              </div>

              {/* Sensory Signals Section */}
              <div className="space-y-4 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Sensory details (optional)
                </h4>

                <p className="text-xs text-muted-foreground">
                  Help other families by sharing sensory-specific information
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <LevelSelect
                    label="Noise level"
                    value={form.noiseLevel}
                    onChange={(v) =>
                      setForm((p) => ({ ...p, noiseLevel: v }))
                    }
                    fieldKey="noiseLevel"
                    icon={Volume2}
                  />
                  <LevelSelect
                    label="Lighting"
                    value={form.lighting}
                    onChange={(v) => setForm((p) => ({ ...p, lighting: v }))}
                    fieldKey="lighting"
                    icon={Sun}
                  />
                  <LevelSelect
                    label="Crowding"
                    value={form.crowding}
                    onChange={(v) => setForm((p) => ({ ...p, crowding: v }))}
                    fieldKey="crowding"
                    icon={Users}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-3 text-sm transition-colors hover:bg-background">
                    <Checkbox
                      checked={form.quietSpace}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, quietSpace: Boolean(v) }))
                      }
                    />
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      Quiet space available
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl bg-background/50 p-3 text-sm transition-colors hover:bg-background">
                    <Checkbox
                      checked={form.sensoryHours}
                      onCheckedChange={(v) =>
                        setForm((p) => ({ ...p, sensoryHours: Boolean(v) }))
                      }
                    />
                    <span className="flex items-center gap-2">
                      <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                      Sensory hours offered
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Section */}
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">
                  💙 Your review helps other families make confident decisions
                </p>

                <Button
                  type="submit"
                  disabled={pending || !authed}
                  size="lg"
                  className="rounded-2xl"
                >
                  {pending ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Update review
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Submit review
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}