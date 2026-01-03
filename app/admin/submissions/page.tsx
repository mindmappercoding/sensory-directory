// app/admin/submissions/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SubmissionActionButton } from "./SubmissionActionButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;
type Status = "PENDING" | "APPROVED" | "REJECTED";

function getStatus(sp: SearchParams): Status {
  const raw = typeof sp.status === "string" ? sp.status : undefined;
  if (raw === "APPROVED" || raw === "REJECTED" || raw === "PENDING") return raw;
  return "PENDING";
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function fmtDate(d: Date) {
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function yesNo(v: unknown) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

function safeStr(v: unknown) {
  return typeof v === "string" && v.trim().length ? v.trim() : "—";
}

function safeArr(v: unknown) {
  return Array.isArray(v) ? v : [];
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "PENDING"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : status === "APPROVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <span className="rounded-full border bg-background px-2 py-0.5 text-xs">
      {text}
    </span>
  );
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = getStatus(sp);

  const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.venueSubmission.count({ where: { status: "PENDING" } }),
    prisma.venueSubmission.count({ where: { status: "APPROVED" } }),
    prisma.venueSubmission.count({ where: { status: "REJECTED" } }),
  ]);

  const submissions = await prisma.venueSubmission.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      proposedName: true,
      submittedBy: true,
      createdAt: true,
      reviewedAt: true,
      venueId: true,
      payload: true,
    },
  });

  const tabs: Array<{ key: Status; label: string; count: number }> = [
    { key: "PENDING", label: "Pending", count: pendingCount },
    { key: "APPROVED", label: "Approved", count: approvedCount },
    { key: "REJECTED", label: "Rejected", count: rejectedCount },
  ];

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Venue submissions</h1>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{status}</span> submissions (max
            100).
          </p>
        </div>

        <Link href="/admin" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = t.key === status;
          return (
            <Link
              key={t.key}
              href={`/admin/submissions?status=${t.key}`}
              className={[
                "rounded-full border px-3 py-1 text-sm transition",
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-background hover:bg-muted/60",
              ].join(" ")}
            >
              {t.label}{" "}
              <span
                className={[
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  active ? "bg-white/20" : "bg-muted",
                ].join(" ")}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">No submissions for this status.</p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => {
            const payload = isObject(s.payload) ? s.payload : {};
            const sensory = isObject(payload.sensory) ? payload.sensory : {};
            const facilities = isObject(payload.facilities)
              ? payload.facilities
              : {};

            const tags = safeArr(payload.tags).filter(
              (t) => typeof t === "string" && t.trim().length
            ) as string[];

            const coverImageUrl =
              typeof payload.coverImageUrl === "string" &&
              payload.coverImageUrl.trim().length
                ? payload.coverImageUrl.trim()
                : null;

            const imageUrls = safeArr(payload.imageUrls)
              .filter((u) => typeof u === "string" && u.trim().length)
              .map((u) => (u as string).trim())
              .slice(0, 10);

            const isPending = s.status === "PENDING";

            return (
              <li key={s.id} className="rounded-2xl border bg-card p-5 space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium truncate">{s.proposedName}</p>
                      <StatusPill status={s.status} />
                      <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-xs">
                        {s.type}
                      </span>
                      {s.venueId && (
                        <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-xs">
                          venueId: {s.venueId}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {safeStr(payload.city)} • {safeStr(payload.postcode)} •{" "}
                      submitted {fmtDate(s.createdAt)}
                      {s.submittedBy ? ` • by ${s.submittedBy}` : ""}
                      {s.reviewedAt ? ` • reviewed ${fmtDate(s.reviewedAt)}` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex gap-2 shrink-0">
                      <SubmissionActionButton id={s.id} action="approve" />
                      <SubmissionActionButton id={s.id} action="reject" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground shrink-0">
                      {s.status === "APPROVED" ? "Approved" : "Rejected"}
                    </div>
                  )}
                </div>

                {/* Full payload */}
                <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
                  {/* Left: textual fields */}
                  <section className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <Field label="Website">
                        {typeof payload.website === "string" &&
                        payload.website.trim().length ? (
                          <a
                            className="underline"
                            href={payload.website}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {payload.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Field>

                      <Field label="Phone">{safeStr(payload.phone)}</Field>

                      <Field label="Address line 1">{safeStr(payload.address1)}</Field>
                      <Field label="Address line 2">{safeStr(payload.address2)}</Field>

                      <Field label="City">{safeStr(payload.city)}</Field>
                      <Field label="County">{safeStr(payload.county)}</Field>

                      <Field label="Postcode">{safeStr(payload.postcode)}</Field>
                      <Field label="Submitted name">{safeStr(payload.proposedName)}</Field>
                    </div>

                    <Field label="Description">
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {safeStr(payload.description)}
                      </div>
                    </Field>

                    <Field label={`Tags (${tags.length})`}>
                      {tags.length ? (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((t) => (
                            <Chip key={t} text={t} />
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </Field>

                    {/* Sensory */}
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="text-sm font-semibold">Sensory</div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <Field label="Noise">{safeStr(sensory.noiseLevel)}</Field>
                        <Field label="Lighting">{safeStr(sensory.lighting)}</Field>
                        <Field label="Crowding">{safeStr(sensory.crowding)}</Field>
                        <Field label="Quiet space">{yesNo(sensory.quietSpace)}</Field>
                        <Field label="Sensory hours">{yesNo(sensory.sensoryHours)}</Field>
                      </div>

                      <div className="mt-3">
                        <Field label="Sensory notes">
                          <div className="whitespace-pre-wrap">
                            {safeStr(sensory.notes)}
                          </div>
                        </Field>
                      </div>
                    </div>

                    {/* Facilities (optional) */}
                    <div className="rounded-xl border bg-muted/20 p-4">
                      <div className="text-sm font-semibold">Facilities (optional)</div>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <Field label="Parking">{yesNo(facilities.parking)}</Field>
                        <Field label="Accessible toilet">
                          {yesNo(facilities.accessibleToilet)}
                        </Field>
                        <Field label="Baby change">{yesNo(facilities.babyChange)}</Field>
                        <Field label="Wheelchair access">
                          {yesNo(facilities.wheelchairAccess)}
                        </Field>
                        <Field label="Staff trained">{yesNo(facilities.staffTrained)}</Field>
                      </div>

                      <div className="mt-3">
                        <Field label="Facilities notes">
                          <div className="whitespace-pre-wrap">
                            {safeStr(facilities.notes)}
                          </div>
                        </Field>
                      </div>
                    </div>
                  </section>

                  {/* Right: Images */}
                  <aside className="space-y-3">
                    <div className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Images</div>
                        <div className="text-xs text-muted-foreground">
                          cover + {imageUrls.length} gallery
                        </div>
                      </div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Cover</div>
                          {coverImageUrl ? (
                            <a href={coverImageUrl} target="_blank" rel="noreferrer">
                              <img
                                src={coverImageUrl}
                                alt="Cover"
                                className="mt-2 w-full rounded-xl border object-cover aspect-[16/9]"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                              No cover image
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground">Gallery</div>
                          {imageUrls.length ? (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {imageUrls.map((u) => (
                                <a
                                  key={u}
                                  href={u}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={u}
                                    alt="Gallery"
                                    className="h-24 w-full rounded-lg border object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                              No gallery images
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Raw payload */}
                    <details className="rounded-2xl border p-4">
                      <summary className="cursor-pointer text-sm font-semibold">
                        Raw submission payload (debug)
                      </summary>
                      <pre className="mt-3 max-h-[380px] overflow-auto rounded-xl border bg-muted/30 p-3 text-xs">
                        {JSON.stringify(payload, null, 2)}
                      </pre>
                    </details>
                  </aside>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">
        {children ?? <div className="truncate">{value ?? "—"}</div>}
      </div>
    </div>
  );
}
