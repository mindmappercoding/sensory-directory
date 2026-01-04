// app/admin/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    venueCount,
    verifiedVenueCount,
    archivedVenueCount,
    pendingSubmissions,
    openReports,
    userCount,
  ] = await Promise.all([
    prisma.venue.count(),
    prisma.venue.count({ where: { verifiedAt: { not: null } } }),
    prisma.venue.count({ where: { archivedAt: { not: null } } }),
    prisma.venueSubmission.count({ where: { status: "PENDING" } }),
    prisma.reviewReport.count({ where: { status: "OPEN" } }),
    prisma.user.count(),
  ]);

  const unverifiedVenueCount = venueCount - verifiedVenueCount;

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Quick overview of venues, submissions, users, and review reports.
        </p>
      </header>

      {/* Overview stats */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Venues
          </p>
          <p className="text-2xl font-semibold">{venueCount}</p>
          <p className="text-xs text-muted-foreground">
            {verifiedVenueCount} verified • {unverifiedVenueCount} unverified •{" "}
            {archivedVenueCount} archived
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Pending submissions
          </p>
          <p className="text-2xl font-semibold">{pendingSubmissions}</p>
          <p className="text-xs text-muted-foreground">
            New venues or edits waiting for review.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Users
          </p>
          <p className="text-2xl font-semibold">{userCount}</p>
          <p className="text-xs text-muted-foreground">
            People who have signed in.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Open review reports
          </p>
          <p className="text-2xl font-semibold">{openReports}</p>
          <p className="text-xs text-muted-foreground">
            Reports that still need a decision.
          </p>
        </div>
      </section>

      {/* Navigation cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/venues"
          className="rounded-2xl border bg-card p-4 hover:bg-accent/40 transition-colors"
        >
          <h2 className="text-sm font-semibold mb-1">Manage venues</h2>
          <p className="text-xs text-muted-foreground mb-3">
            View, verify, archive, and edit venues. See ratings and review counts.
          </p>
          <span className="text-xs font-medium underline">Go to venues →</span>
        </Link>

        <Link
          href="/admin/submissions"
          className="rounded-2xl border bg-card p-4 hover:bg-accent/40 transition-colors"
        >
          <h2 className="text-sm font-semibold mb-1">Review submissions</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Approve or reject new venues and suggested edits.
          </p>
          <span className="text-xs font-medium underline">
            Go to submissions →
          </span>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-2xl border bg-card p-4 hover:bg-accent/40 transition-colors"
        >
          <h2 className="text-sm font-semibold mb-1">Users</h2>
          <p className="text-xs text-muted-foreground mb-3">
            View signed-in users and manage admin access.
          </p>
          <span className="text-xs font-medium underline">Go to users →</span>
        </Link>

        <Link
          href="/admin/reports"
          className="rounded-2xl border bg-card p-4 hover:bg-accent/40 transition-colors"
        >
          <h2 className="text-sm font-semibold mb-1">Review reports</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Handle reported reviews, hide/restore, or dismiss them.
          </p>
          <span className="text-xs font-medium underline">Go to reports →</span>
        </Link>
      </section>
    </main>
  );
}
