// app/admin/reports/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReportActions from "./ReportActions";
import {
  Flag,
  MapPin,
  Star,
  Calendar,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam / Advertising",
  HARASSMENT: "Harassment",
  HATE: "Hate / Discrimination",
  OFF_TOPIC: "Off Topic",
  MISINFORMATION: "Misinformation",
  PRIVACY: "Privacy Issue",
  OTHER: "Other",
};

export default async function AdminReportsPage() {
  const reports = await prisma.reviewReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      review: {
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          hiddenAt: true,
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
              postcode: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate flagged reviews and take action
          </p>
        </div>
        <div className="rounded-2xl bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {reports.length} open report{reports.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="rounded-3xl border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Flag className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No open reports</h3>
          <p className="text-sm text-muted-foreground">
            All reports have been handled 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const reasonLabel = REASON_LABELS[r.reason] || r.reason;
            const isHidden = !!r.review?.hiddenAt;

            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-3xl border bg-card transition-all hover:shadow-md"
              >
                {/* Header */}
                <div className="border-b bg-red-50/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100">
                        <Flag className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            {reasonLabel}
                          </span>
                          {isHidden && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                              <EyeOff className="mr-1 inline h-3 w-3" />
                              Currently hidden
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 p-5">
                  {/* Venue Info */}
                  {r.review?.venue && (
                    <div className="rounded-2xl bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Venue
                      </div>
                      <div className="space-y-2">
                        <Link
                          href={`/venues/${r.review.venue.id}`}
                          className="block font-semibold hover:underline"
                        >
                          {r.review.venue.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[r.review.venue.city, r.review.venue.postcode]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                        <Link
                          href={`/admin/venues/${r.review.venue.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          Admin view
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Review Content */}
                  {r.review ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold">
                            {r.review.rating}/5
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Review ID: {r.review.id.slice(0, 8)}...
                        </span>
                      </div>

                      {r.review.title && (
                        <div>
                          <h4 className="font-semibold">{r.review.title}</h4>
                        </div>
                      )}

                      {r.review.content && (
                        <div className="rounded-2xl bg-muted/30 p-4">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {r.review.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-amber-800">
                        Review no longer exists (already deleted)
                      </p>
                    </div>
                  )}

                  {/* Reporter Note */}
                  {r.message && (
                    <div className="rounded-2xl border-l-4 border-red-500 bg-red-50/50 p-4">
                      <p className="mb-1 text-xs font-medium text-red-900">
                        Reporter's note:
                      </p>
                      <p className="text-sm text-red-800">{r.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {r.review && (
                    <div className="border-t pt-4">
                      <ReportActions reportId={r.id} reviewId={r.review.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}