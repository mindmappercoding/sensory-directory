// app/admin/users/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRoleButton } from "./userRoleButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const qRaw = typeof sp.q === "string" ? sp.q : "";
  const q = qRaw.trim();

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [{ email: { contains: q } }, { name: { contains: q } }],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // ✅ Robust counts (does NOT depend on Prisma relation _count)
  // Try groupBy first (fast), fallback to per-user counts if needed.
  let reviewCountByUser = new Map<string, number>();
  let submissionCountByUser = new Map<string, number>();

  try {
    const [reviewGroups, submissionGroups] = await Promise.all([
      prisma.review.groupBy({
        by: ["authorId"],
        _count: { _all: true },
      }),
      prisma.venueSubmission.groupBy({
        by: ["submittedByUserId"],
        where: { submittedByUserId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    reviewCountByUser = new Map(
      reviewGroups.map((g) => [g.authorId, g._count._all])
    );

    submissionCountByUser = new Map(
      submissionGroups
        .filter((g) => typeof g.submittedByUserId === "string")
        .map((g) => [g.submittedByUserId as string, g._count._all])
    );
  } catch {
    // Fallback (still correct, just more queries)
    const pairs = await Promise.all(
      users.map(async (u) => {
        const [rc, sc] = await Promise.all([
          prisma.review.count({ where: { authorId: u.id } }),
          prisma.venueSubmission.count({ where: { submittedByUserId: u.id } }),
        ]);
        return { id: u.id, rc, sc };
      })
    );

    reviewCountByUser = new Map(pairs.map((p) => [p.id, p.rc]));
    submissionCountByUser = new Map(pairs.map((p) => [p.id, p.sc]));
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Signed-in users, their reviews, and their venue submissions.
          </p>
        </div>
        <Link href="/admin" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <form className="flex gap-2" action="/admin/users" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="w-full max-w-md rounded-xl border bg-background px-3 py-2 text-sm"
        />
        <button className="rounded-xl border px-4 py-2 text-sm hover:bg-muted">
          Search
        </button>
      </form>

      <div className="rounded-2xl border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground bg-muted/30">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Reviews</div>
          <div className="col-span-2">Submissions</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No users found.</div>
        ) : (
          <ul className="divide-y">
            {users.map((u) => {
              const reviewCount = reviewCountByUser.get(u.id) ?? 0;
              const submissionCount = submissionCountByUser.get(u.id) ?? 0;

              return (
                <li
                  key={u.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm"
                >
                  <div className="col-span-4 min-w-0">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium truncate underline underline-offset-2"
                    >
                      {u.name || "—"}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email || "No email"} • Joined{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-xs ring-1",
                        u.role === "ADMIN"
                          ? "bg-emerald-50 ring-emerald-200"
                          : "bg-muted ring-border",
                      ].join(" ")}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="col-span-2">{reviewCount}</div>
                  <div className="col-span-2">{submissionCount}</div>

                  <div className="col-span-2 flex justify-end gap-2">
                    <UserRoleButton userId={u.id} currentRole={u.role} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
