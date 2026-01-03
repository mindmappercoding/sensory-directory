"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SubmissionActionButton({
  id,
  action,
}: {
  id: string;
  action: "approve" | "reject";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (action === "reject") {
      const ok = window.confirm(
        "Reject this submission? This will mark it as REJECTED."
      );
      if (!ok) return;
    }

    if (action === "approve") {
      const ok = window.confirm(
        "Approve this submission? This will create a Venue and make it live."
      );
      if (!ok) return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/submissions/${id}/${action}`, {
          method: "POST",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(
            json?.error ? String(json.error) : `Failed to ${action} submission`
          );
          return;
        }

        toast.success(
          action === "approve" ? "Submission approved" : "Submission rejected",
          {
            description:
              action === "approve"
                ? "Venue is now live."
                : "The submission has been rejected.",
          }
        );

        router.refresh();
      } catch (e: any) {
        toast.error(e?.message ?? `Failed to ${action} submission`);
      }
    });
  }

  const isReject = action === "reject";

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={[
        "rounded-lg border px-3 py-1 text-sm transition disabled:opacity-50",
        isReject
          ? "border-red-200 hover:bg-red-50"
          : "border-emerald-200 hover:bg-emerald-50",
      ].join(" ")}
    >
      {pending ? "Working..." : isReject ? "Reject" : "Approve"}
    </button>
  );
}
