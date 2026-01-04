// app/admin/submissions/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubmissionEditForm } from "./SubmissionEditForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Normalise to standard UK format:
 * - uppercase
 * - remove spaces
 * - insert a single space before last 3 chars
 *   e.g. "ls211aa" -> "LS21 1AA"
 */
function formatUKPostcode(input: string) {
  const raw = input.toUpperCase().replace(/\s+/g, "").trim();
  if (raw.length <= 3) return raw;
  return `${raw.slice(0, -3)} ${raw.slice(-3)}`.trim();
}

function compactUKPostcode(input: string) {
  return input.toUpperCase().replace(/\s+/g, "").trim();
}

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const submission = await prisma.venueSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      type: true,
      proposedName: true,
      submittedBy: true,
      createdAt: true,
      reviewedAt: true,
      venueId: true,
      payload: true,
    },
  });

  if (!submission) return notFound();

  const payload = isObject(submission.payload) ? submission.payload : {};

  const postcodeRaw = typeof payload.postcode === "string" ? payload.postcode : "";
  const postcodeFormatted = postcodeRaw ? formatUKPostcode(postcodeRaw) : "";
  const postcodeCompact = postcodeRaw ? compactUKPostcode(postcodeRaw) : "";

  /**
   * ✅ IMPORTANT:
   * Only show "possible duplicates" for NEW_VENUE submissions.
   * For EDIT_VENUE, the venue being edited will naturally share the same postcode,
   * which causes a false positive “duplicate” every time.
   */
  const shouldCheckDuplicates =
    submission.type === "NEW_VENUE" &&
    submission.status === "PENDING" &&
    postcodeCompact.length > 0;

  const duplicates = shouldCheckDuplicates
    ? await prisma.venue.findMany({
        where: {
          // Support older venues that might have postcode stored without a space
          postcode: { in: [postcodeFormatted, postcodeCompact] },
          OR: [{ archivedAt: null }, { archivedAt: { isSet: false } }],
        },
        select: {
          id: true,
          name: true,
          city: true,
          postcode: true,
          createdAt: true,
        },
        take: 10,
      })
    : [];

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Review submission</h1>
          <p className="text-sm text-muted-foreground">
            {submission.proposedName} • {submission.status} • {submission.type}
          </p>
        </div>

        <Link href="/admin/submissions" className="text-sm underline">
          Back to submissions
        </Link>
      </div>

      {duplicates.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            Possible duplicates (same postcode)
          </div>
          <div className="mt-2 text-sm text-amber-900/80">
            This is only shown for NEW venue submissions.
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {duplicates.map((d) => (
              <li key={d.id} className="flex flex-wrap gap-2">
                <span className="font-medium">{d.name}</span>
                <span className="text-amber-900/70">
                  {d.city} • {d.postcode}
                </span>
                <Link className="underline" href={`/venues/${d.id}`}>
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SubmissionEditForm
        id={submission.id}
        status={submission.status}
        initialPayload={payload}
        hasDuplicates={duplicates.length > 0}
      />
    </main>
  );
}
