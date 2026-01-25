// app/admin/users/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRoleButton } from "../userRoleButton";
import { notFound } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Star,
  FileText,
  Send,
  MapPin,
  Clock,
  EyeOff,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return notFound();

  const [reviewTotal, submissionTotal] = await Promise.all([
    prisma.review.count({ where: { authorId: id } }),
    prisma.venueSubmission.count({ where: { submittedByUserId: id } }),
  ]);

  const [reviews, submissions] = await Promise.all([
    prisma.review.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        rating: true,
        title: true,
        content: true,
        visitTimeHint: true,
        createdAt: true,
        hiddenAt: true,
        venue: { select: { id: true, name: true, city: true } },
      },
    }),
    prisma.venueSubmission.findMany({
      where: { submittedByUserId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        type: true,
        status: true,
        proposedName: true,
        createdAt: true,
        reviewedAt: true,
        venueId: true,
        payload: true,
      },
    }),
  ]);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 text-2xl font-bold tracking-tight truncate">
              {user.name || "Unnamed User"}
            </h1>
            
            <div className="mb-3 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 truncate">
                <Mail className="h-3.5 w-3.5" />
                {user.email || "No email"}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Joined {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                  <Shield className="h-3 w-3" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium ring-1 ring-border">
                  <User className="h-3 w-3" />
                  User
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                <FileText className="h-3 w-3" />
                {reviewTotal} review{reviewTotal === 1 ? "" : "s"}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
                <Send className="h-3 w-3" />
                {submissionTotal} submission{submissionTotal === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <UserRoleButton userId={user.id} currentRole={user.role} />
          <Link href="/admin/users">
            <Button variant="outline" size="sm" className="rounded-2xl">
              <ArrowLeft className="mr-2 h-3.5 w-3.5" />
              Back to users
            </Button>
          </Link>
        </div>
      </div>

      {/* Reviews */}
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Recent Reviews</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest {reviews.length} of {reviewTotal} total review{reviewTotal === 1 ? "" : "s"}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Star className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No reviews yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => {
              const isHidden = !!r.hiddenAt;
              
              return (
                <li
                  key={r.id}
                  className={`p-5 transition-colors hover:bg-muted/20 ${
                    isHidden ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/venues/${r.venue.id}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {r.venue.name}
                        </Link>
                        {isHidden && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {r.venue.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {r.venue.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {r.title && (
                        <p className="font-medium text-sm">{r.title}</p>
                      )}
                      {r.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.content}
                        </p>
                      )}

                      {r.visitTimeHint && (
                        <p className="text-xs text-muted-foreground">
                          Visit: {r.visitTimeHint}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">
                        {r.rating}/5
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Submissions */}
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Recent Submissions</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest {submissions.length} of {submissionTotal} total submission{submissionTotal === 1 ? "" : "s"}
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Send className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {submissions.map((s) => {
              const payload =
                typeof s.payload === "object" && s.payload !== null
                  ? (s.payload as Record<string, unknown>)
                  : {};
              const city = typeof payload.city === "string" ? payload.city : "";
              const postcode =
                typeof payload.postcode === "string" ? payload.postcode : "";

              const statusColor =
                s.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : s.status === "REJECTED"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-amber-50 text-amber-700 ring-amber-200";

              return (
                <li key={s.id} className="p-5 transition-colors hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold truncate">
                          {s.proposedName || "Untitled submission"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusColor}`}>
                          {s.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {city} {postcode && `• ${postcode}`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {s.reviewedAt && (
                          <span className="text-xs">
                            Reviewed{" "}
                            {new Date(s.reviewedAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {s.venueId && (
                      <Link href={`/venues/${s.venueId}`}>
                        <Button variant="outline" size="sm" className="rounded-2xl">
                          View venue
                        </Button>
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}