// app/admin/reports/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReportActions from "./ReportActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Review reports</h1>
        <Link href="/admin/venues" className="text-sm underline">
          Back to venues
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open reports 🎉</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border bg-card p-4 space-y-3"
            >
              <div className="text-xs text-muted-foreground">
                {r.reason} • {new Date(r.createdAt).toLocaleString()}
              </div>

              <div className="space-y-2 text-sm">
                {r.review?.venue && (
                  <div className="text-xs text-muted-foreground">
                    Venue:{" "}
                    <Link
                      href={`/venues/${r.review.venue.id}`}
                      className="underline"
                    >
                      {r.review.venue.name}
                    </Link>{" "}
                    ({[r.review.venue.city, r.review.venue.postcode]
                      .filter(Boolean)
                      .join(" • ")}
                    ){" "}
                    ·{" "}
                    <Link
                      href={`/admin/venues/${r.review.venue.id}`}
                      className="underline"
                    >
                      Admin view
                    </Link>
                  </div>
                )}

                <div className="font-medium">
                  Review {r.review?.id} • {r.review?.rating}/5{" "}
                  {r.review?.hiddenAt && (
                    <span className="ml-2 text-xs text-amber-600">
                      (currently hidden)
                    </span>
                  )}
                </div>

                {r.review?.title && (
                  <div className="mt-1 font-semibold">{r.review.title}</div>
                )}

                {r.review?.content && (
                  <div className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {r.review.content}
                  </div>
                )}

                {r.message && (
                  <div className="mt-2 text-xs">
                    <span className="font-medium">Reporter note:</span>{" "}
                    {r.message}
                  </div>
                )}
              </div>

              {r.review ? (
                <ReportActions reportId={r.id} reviewId={r.review.id} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Review no longer exists (already deleted).
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
