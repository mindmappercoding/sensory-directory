// app/admin/submissions/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SubmissionEditForm } from "./SubmissionEditForm";
import { FileCheck, AlertTriangle, ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

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

  const shouldCheckDuplicates =
    submission.type === "NEW_VENUE" &&
    submission.status === "PENDING" &&
    postcodeCompact.length > 0;

  const duplicates = shouldCheckDuplicates
    ? await prisma.venue.findMany({
        where: {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10">
            <FileCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Review Submission</h1>
            <p className="text-sm text-muted-foreground">
              {submission.proposedName} • {submission.status} • {submission.type}
            </p>
          </div>
        </div>
        <Link href="/admin/submissions">
          <Button variant="outline" size="sm" className="rounded-2xl">
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to submissions
          </Button>
        </Link>
      </div>

      {/* Duplicates Warning */}
      {duplicates.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <div className="border-b border-amber-200 bg-amber-100/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  Possible Duplicates Detected
                </h3>
                <p className="text-sm text-amber-800">
                  Found {duplicates.length} venue{duplicates.length === 1 ? "" : "s"} with the same postcode
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-4">
            <p className="text-sm text-amber-900/80">
              This is only shown for NEW venue submissions. Please verify these aren't duplicates before approving.
            </p>
            
            <ul className="mt-3 space-y-2">
              {duplicates.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-2xl bg-white/80 p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <div>
                      <span className="font-medium text-amber-950">{d.name}</span>
                      <span className="mx-2 text-amber-700">•</span>
                      <span className="text-amber-800">{d.city}</span>
                      <span className="mx-2 text-amber-700">•</span>
                      <span className="text-amber-700">{d.postcode}</span>
                    </div>
                  </div>
                  <Link
                    href={`/venues/${d.id}`}
                    className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Form */}
      <SubmissionEditForm
        id={submission.id}
        status={submission.status}
        initialPayload={payload}
        hasDuplicates={duplicates.length > 0}
      />
    </div>
  );
}