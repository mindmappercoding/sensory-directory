// app/admin/users/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserRoleButton } from "./userRoleButton";
import {
  Users,
  Search,
  Shield,
  User,
  FileText,
  Send,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-2xl bg-muted/50 px-4 py-2">
            <span className="text-sm font-medium">{users.length} total</span>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-2">
            <span className="text-sm font-medium text-emerald-700">
              {adminCount} admin{adminCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2" action="/admin/users" method="get">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full rounded-2xl border bg-background py-2 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button type="submit" className="rounded-2xl">
          Search
        </Button>
      </form>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/30 px-6 py-4 text-sm font-medium text-muted-foreground">
          <div className="col-span-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            User
          </div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Reviews
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Submissions
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">
              {q ? "No users found" : "No users yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {q
                ? "Try a different search term"
                : "Users will appear here once they sign in"}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {users.map((u) => {
              const reviewCount = reviewCountByUser.get(u.id) ?? 0;
              const submissionCount = submissionCountByUser.get(u.id) ?? 0;
              const isAdmin = u.role === "ADMIN";

              return (
                <li
                  key={u.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  {/* User Info */}
                  <div className="col-span-4 min-w-0">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="mb-1 block font-semibold hover:underline"
                    >
                      {u.name || "Unnamed User"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{u.email || "No email"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="col-span-2">
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
                  </div>

                  {/* Review Count */}
                  <div className="col-span-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {reviewCount}
                    </div>
                  </div>

                  {/* Submission Count */}
                  <div className="col-span-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      {submissionCount}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
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