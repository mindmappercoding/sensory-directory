// app/admin/venues/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArchiveVenueButton } from "./ArchiveVenueButton";
import { VerifyVenueButton } from "./VerifyVenueButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { createdAt: "desc" },
    include: { reviews: true },
  });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All venues</h1>
        <Link href="/admin/submissions" className="text-sm underline">
          View submissions
        </Link>
      </div>

      <div className="space-y-4">
        {venues.map((v) => {
          const archived = !!v.archivedAt;

          return (
            <div
              key={v.id}
              className={[
                "relative rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
                archived && "bg-red-50 border-red-200 opacity-75",
              ].join(" ")}
            >
              {archived && (
                <span className="absolute top-2 right-2 rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                  Archived
                </span>
              )}

              <div className="min-w-0">
                <p className="font-medium truncate">{v.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {[v.city, v.postcode].filter(Boolean).join(" • ")}
                </p>

                <div className="mt-1 text-xs space-x-2">
                  {v.verifiedAt ? (
                    <span className="text-emerald-600">Verified</span>
                  ) : (
                    <span className="text-amber-600">Unverified</span>
                  )}
                  <span>•</span>
                  <span>{v.reviewCount} reviews</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/venues/${v.id}`}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  View
                </Link>

                <Link
                  href={`/admin/venues/${v.id}/edit`}
                  className="rounded-lg border px-3 py-1 text-sm"
                >
                  Edit
                </Link>

                {!archived && (
                  <>
                    <VerifyVenueButton
                      id={v.id}
                      verified={!!v.verifiedAt}
                    />
                    <ArchiveVenueButton id={v.id} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
