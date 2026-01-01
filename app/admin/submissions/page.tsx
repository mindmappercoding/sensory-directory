// app/admin/submissions/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toast } from "sonner";
import { SubmissionActionButton } from "./SubmissionActionButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSubmissionsPage() {
  const pending = await prisma.venueSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pending submissions</h1>
        <Link href="/admin" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      {pending.length === 0 ? (
        <p className="text-muted-foreground">No pending submissions.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((s) => {
            const payload =
              typeof s.payload === "object" && s.payload !== null
                ? (s.payload as Record<string, unknown>)
                : {};
            const city = payload.city as string | undefined;
            return (
              <li key={s.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.proposedName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {city ? `${city} • ` : ""}
                      {new Date(s.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <SubmissionActionButton id={s.id} action="approve" />
                    <SubmissionActionButton id={s.id} action="reject" />
                  </div>
                </div>

                {/* Quick preview (adjust fields to your VenueSubmission model) */}
                <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {typeof payload.address === "string" && (
                    <Field label="Address" value={payload.address} />
                  )}
                  {typeof payload.postcode === "string" && (
                    <Field label="Postcode" value={payload.postcode} />
                  )}
                  {typeof payload.website === "string" && (
                    <Field label="Website" value={payload.website} />
                  )}
                  {typeof payload.phone === "string" && (
                    <Field label="Phone" value={payload.phone} />
                  )}
                </div>
              </li>
            );
          })}
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

function ApproveButton({ id }: { id: string }) {
  return (
    <form action={`/api/admin/submissions/${id}/approve`} method="post">
      <button
        className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
        type="submit"
      >
        Approve
      </button>
    </form>
  );
}

function RejectButton({ id }: { id: string }) {
  return (
    <form action={`/api/admin/submissions/${id}/reject`} method="post">
      <button
        className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
        type="submit"
      >
        Reject
      </button>
    </form>
  );
}
