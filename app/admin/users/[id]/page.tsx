// app/admin/users/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRoleButton } from "../userRoleButton";
import { notFound } from "next/navigation";

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

  // ✅ total counts (robust + accurate)
  const [reviewTotal, submissionTotal] = await Promise.all([
    prisma.review.count({ where: { authorId: id } }),
    prisma.venueSubmission.count({ where: { submittedByUserId: id } }),
  ]);

  // ✅ recent items (latest 25)
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

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">
            {user.name || "User"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {user.email || "No email"} • Joined{" "}
            {new Date(user.createdAt).toLocaleString("en-GB")}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span
              className={[
                "inline-flex rounded-full px-2 py-0.5 text-xs ring-1",
                user.role === "ADMIN"
                  ? "bg-emerald-50 ring-emerald-200"
                  : "bg-muted ring-border",
              ].join(" ")}
            >
              {user.role}
            </span>

            <span className="inline-flex rounded-full px-2 py-0.5 text-xs ring-1 bg-muted ring-border">
              {reviewTotal} reviews
            </span>

            <span className="inline-flex rounded-full px-2 py-0.5 text-xs ring-1 bg-muted ring-border">
              {submissionTotal} submissions
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <UserRoleButton userId={user.id} currentRole={user.role} />
          <Link href="/admin/users" className="text-sm underline">
            Back to users
          </Link>
        </div>
      </div>

      {/* Reviews */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Recent reviews</h2>
          <p className="text-xs text-muted-foreground">Latest 25 reviews.</p>
        </div>

        {reviews.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No reviews yet.</div>
        ) : (
          <ul className="divide-y">
            {reviews.map((r) => (
              <li key={r.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/venues/${r.venue.id}`}
                      className="font-medium underline underline-offset-2 truncate block"
                    >
                      {r.venue.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.venue.city ? `${r.venue.city} • ` : ""}
                      {new Date(r.createdAt).toLocaleString("en-GB")}
                      {r.hiddenAt ? " • Hidden" : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold">
                    {r.rating}/5
                  </div>
                </div>

                {(r.title || r.content) && (
                  <div className="text-sm">
                    {r.title ? <div className="font-medium">{r.title}</div> : null}
                    {r.content ? (
                      <div className="text-muted-foreground">{r.content}</div>
                    ) : null}
                  </div>
                )}

                {r.visitTimeHint ? (
                  <div className="text-xs text-muted-foreground">
                    Visit date: {r.visitTimeHint}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Submissions */}
      <section className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Recent submissions</h2>
          <p className="text-xs text-muted-foreground">Latest 25 submissions.</p>
        </div>

        {submissions.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No submissions yet.
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

              return (
                <li key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {s.proposedName || "Untitled submission"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.type} • {s.status} •{" "}
                        {new Date(s.createdAt).toLocaleString("en-GB")}
                        {s.reviewedAt ? (
                          <>
                            {" "}
                            • Reviewed{" "}
                            {new Date(s.reviewedAt).toLocaleString("en-GB")}
                          </>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {city ? `${city} • ` : ""}
                        {postcode || ""}
                      </div>
                    </div>

                    <div className="shrink-0 flex gap-2">
                      {s.venueId ? (
                        <Link
                          href={`/venues/${s.venueId}`}
                          className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                        >
                          View venue
                        </Link>
                      ) : null}
                    </div>
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
