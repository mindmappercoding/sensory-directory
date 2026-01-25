import SubmitVenueForm from "./SubmitVenueForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Sparkles,
  Heart,
  CheckCircle,
  Image as ImageIcon,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SubmitPage() {
  return (
    <main className="space-y-6 py-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/20 p-8 sm:p-10">
        <div className="relative z-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="h-4 w-4" />
            Help families discover safe spaces
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Submit a venue
          </h1>

          <p className="mb-6 text-lg text-muted-foreground sm:text-xl">
            Share a sensory-friendly place you've discovered. Every submission
            helps families find calm, inclusive spaces for their children.
          </p>

          <Link href="/venues">
            <Button variant="outline" size="lg" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to venues
            </Button>
          </Link>
        </div>

        {/* Decorative gradient blob */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form Section */}
        <section className="space-y-6">
          <div className="rounded-3xl border bg-card p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Venue details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill in the details below. All submissions are reviewed before
                  being published.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Community powered
              </div>
            </div>

            <SubmitVenueForm />
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Tips Card */}
          <div className="rounded-3xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Quick tips</h3>
            </div>

            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <ImageIcon className="h-3 w-3 text-primary" />
                </div>
                <span>
                  <strong className="font-medium text-foreground">Photos help trust:</strong>{" "}
                  Add clear images showing the space and atmosphere
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <span>
                  <strong className="font-medium text-foreground">Be specific:</strong>{" "}
                  Even "not sure" sensory info is valuable for families
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Tag className="h-3 w-3 text-primary" />
                </div>
                <span>
                  <strong className="font-medium text-foreground">Choose relevant tags:</strong>{" "}
                  Pick tags that match how parents search
                </span>
              </li>
            </ul>
          </div>

          {/* What Happens Next */}
          <div className="rounded-3xl border bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-6 dark:from-emerald-950/20 dark:to-emerald-950/10">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
                <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold">What happens next?</h3>
            </div>

            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  1
                </span>
                <span>We review your submission within 24-48 hours</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  2
                </span>
                <span>Once approved, it appears in search results</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  3
                </span>
                <span>Families can discover and review the venue</span>
              </li>
            </ol>

            <div className="mt-4 rounded-2xl bg-background/50 p-3 text-xs">
              💙 Thank you for helping families find calmer, more welcoming spaces
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}