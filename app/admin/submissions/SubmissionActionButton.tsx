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
    startTransition(async () => {
      const res = await fetch(`/api/admin/submissions/${id}/${action}`, {
        method: "POST",
      });

      if (!res.ok) {
        toast.error(`Failed to ${action} submission`);
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

      router.refresh(); // ✅ re-fetch server data
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
    >
      {pending ? "Working..." : action === "approve" ? "Approve" : "Reject"}
    </button>
  );
}
