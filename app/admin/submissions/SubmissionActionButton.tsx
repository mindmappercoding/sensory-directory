"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SubmissionActionButton({
  id,
  action,
  force,
}: {
  id: string;
  action: "approve" | "reject";
  force?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // ✅ Critical: stop this button from submitting the parent <form>
    e.preventDefault();
    e.stopPropagation();

    let reason = "";

    if (action === "reject") {
      const ok = window.confirm("Reject this submission?");
      if (!ok) return;

      reason =
        window.prompt("Optional reject reason (saved for admin reference):") ??
        "";
      reason = reason.trim().slice(0, 600);
    }

    if (action === "approve") {
      const ok = window.confirm(
        force
          ? "Approve anyway? (A venue with the same postcode may already exist.)"
          : "Approve this submission? This will create a Venue and make it live."
      );
      if (!ok) return;
    }

    startTransition(async () => {
      try {
        const url =
          action === "approve" && force
            ? `/api/admin/submissions/${id}/approve?force=1`
            : `/api/admin/submissions/${id}/${action}`;

        const res = await fetch(url, {
          method: "POST",
          headers:
            action === "reject" ? { "Content-Type": "application/json" } : undefined,
          body: action === "reject" ? JSON.stringify({ reason }) : undefined,
        });

        const json = await res.json().catch(() => null);

        if (res.status === 409) {
          toast.error(json?.error ?? "Possible duplicate venue detected.", {
            description: "Review it first or use Approve anyway.",
          });
          return;
        }

        if (!res.ok) {
          toast.error(json?.error ? String(json.error) : `Failed to ${action}`);
          return;
        }

        toast.success(
          action === "approve" ? "Submission approved" : "Submission rejected",
          {
            description:
              action === "approve"
                ? "Venue is now live."
                : reason
                ? `Reason saved: ${reason}`
                : "The submission has been rejected.",
          }
        );

        router.refresh();
      } catch (err: any) {
        toast.error(err?.message ?? `Failed to ${action}`);
      }
    });
  }

  const isReject = action === "reject";

  return (
    <button
      type="button" // ✅ Critical
      onClick={handleClick}
      disabled={pending}
      className={[
        "rounded-lg border px-3 py-1 text-sm transition disabled:opacity-50",
        isReject
          ? "border-red-200 hover:bg-red-50"
          : "border-emerald-200 hover:bg-emerald-50",
      ].join(" ")}
    >
      {pending ? "Working..." : isReject ? "Reject" : force ? "Approve anyway" : "Approve"}
    </button>
  );
}
