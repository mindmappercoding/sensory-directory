import SubmitVenueForm from "./SubmitVenueForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[calc(100dvh-4rem)]">
      <div className="flex h-full flex-col gap-6">
        {/* Banner (match Venues page vibe) */}
        <section className="relative shrink-0 overflow-hidden rounded-3xl border bg-card">
          <div className="absolute inset-0 opacity-[0.35]">
            <div className="h-full w-full bg-gradient-to-br from-sky-200/60 via-transparent to-blue-100/60" />
          </div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Submit a venue
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  Add a place that feels safe and manageable for sensory needs.
                  Submissions are reviewed before going public.
                </p>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                <Link href="/venues" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to venues
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Content fills remaining height */}
        <div className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px] min-h-0">
          {/* Scrollable form panel (ONLY scroll area) */}
          <section className="relative min-h-0 rounded-3xl border bg-card">
            <div className="shrink-0 border-b px-5 py-4">
              <div className="text-sm font-semibold">Submission form</div>
              <div className="text-xs text-muted-foreground">
                The form scrolls — the rest of the page stays put.
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 top-[72px] overflow-y-auto overscroll-contain">
              <div className="p-5">
                <SubmitVenueForm />
              </div>
            </div>
          </section>

          {/* Right-side helper panel (no scroll) */}
          <aside className="hidden lg:block">
            <div className="rounded-3xl border bg-card p-5 space-y-3">
              <div className="text-sm font-semibold">Quick tips</div>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                <li>Even “not sure” sensory info still helps.</li>
                <li>Photos are optional but boost trust.</li>
                <li>Pick tags that match how parents search.</li>
              </ul>

              <div className="pt-2 text-xs text-muted-foreground">
                Thank you for helping families find calmer places 💙
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
