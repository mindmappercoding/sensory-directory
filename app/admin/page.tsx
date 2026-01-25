// app/admin/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Building2,
  FileCheck,
  Users,
  Flag,
  CheckCircle,
  Clock,
  Archive,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="mt-2 text-muted-foreground">
          Quick overview of your directory's key metrics and pending actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Venues */}
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Venues
            </p>
            <p className="text-3xl font-bold">{venueCount}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {verifiedVenueCount} verified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                {unverifiedVenueCount} unverified
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                {archivedVenueCount} archived
              </span>
            </div>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10">
              <FileCheck className="h-6 w-6 text-amber-600" />
            </div>
            {pendingSubmissions > 0 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {pendingSubmissions}
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pending Submissions
            </p>
            <p className="text-3xl font-bold">{pendingSubmissions}</p>
            <p className="text-xs text-muted-foreground">
              New venues or edits awaiting review
            </p>
          </div>

          {pendingSubmissions > 0 && (
            <div className="absolute -bottom-1 -right-1 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl" />
          )}
        </div>

        {/* Users */}
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Registered Users
            </p>
            <p className="text-3xl font-bold">{userCount}</p>
            <p className="text-xs text-muted-foreground">
              People who have signed in
            </p>
          </div>
        </div>

        {/* Open Reports */}
        <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card p-6 transition-all hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            {openReports > 0 && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Open Reports
            </p>
            <p className="text-3xl font-bold">{openReports}</p>
            <p className="text-xs text-muted-foreground">
              Reviews flagged for moderation
            </p>
          </div>

          {openReports > 0 && (
            <div className="absolute -bottom-1 -right-1 h-24 w-24 rounded-full bg-red-500/5 blur-2xl" />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/venues"
            className="group rounded-3xl border bg-card p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h4 className="mb-2 font-semibold">Manage Venues</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              View, verify, archive, and edit venues
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              Go to venues
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/admin/submissions"
            className="group rounded-3xl border bg-card p-6 transition-all hover:border-amber-500/50 hover:bg-amber-500/5"
          >
            <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
              <FileCheck className="h-5 w-5 text-amber-600" />
              {pendingSubmissions > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {pendingSubmissions}
                </div>
              )}
            </div>
            <h4 className="mb-2 font-semibold">Review Submissions</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Approve or reject new venues and edits
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600">
              Go to submissions
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/admin/users"
            className="group rounded-3xl border bg-card p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/5"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="mb-2 font-semibold">Manage Users</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              View users and manage admin access
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
              Go to users
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="group rounded-3xl border bg-card p-6 transition-all hover:border-red-500/50 hover:bg-red-500/5"
          >
            <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 transition-colors group-hover:bg-red-500/20">
              <Flag className="h-5 w-5 text-red-600" />
              {openReports > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {openReports}
                </div>
              )}
            </div>
            <h4 className="mb-2 font-semibold">Review Reports</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Handle reported reviews and moderation
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600">
              Go to reports
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}