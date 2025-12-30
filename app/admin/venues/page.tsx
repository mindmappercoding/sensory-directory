// app/admin/venues/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
      },
      sensory: true,
      facilities: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All venues</h1>
        <Link href="/admin/submissions" className="text-sm underline">
          Review submissions
        </Link>
      </div>

      {venues.length === 0 ? (
        <p className="text-muted-foreground">No venues yet.</p>
      ) : (
        <ul className="space-y-4">
          {venues.map((venue) => (
            <li key={venue.id} className="rounded-xl border p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{venue.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {venue.city}
                    {venue.postcode ? ` • ${venue.postcode}` : ""}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(venue.createdAt).toLocaleDateString("en-GB")}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {venue.website && <Field label="Website" value={venue.website} />}
                {venue.phone && <Field label="Phone" value={venue.phone} />}
                {venue.county && <Field label="County" value={venue.county} />}
                {venue.tags.length > 0 && (
                  <Field label="Tags" value={venue.tags.join(", ")} />
                )}
              </div>

              {/* Submission history */}
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Submission history
                </p>

                {venue.submissions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Added manually (no submissions)
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {venue.submissions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <StatusPill status={s.status} />
                        <span>
                          {s.type} •{" "}
                          {new Date(s.createdAt).toLocaleString("en-GB")}
                        </span>
                        {s.rejectionReason && (
                          <span className="text-destructive">
                            — {s.rejectionReason}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Actions (future-proof) */}
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/venues/${venue.id}`}
                  className="text-xs underline"
                >
                  View public page
                </Link>

                <Link
                  href={`/admin/venues/${venue.id}/edit`}
                  className="text-xs underline"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-700",
    APPROVED: "bg-emerald-500/10 text-emerald-700",
    REJECTED: "bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}
