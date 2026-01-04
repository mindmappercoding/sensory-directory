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

  function approveUrl() {
    return action === "approve" && force
      ? `/api/admin/submissions/${id}/approve?force=1`
      : `/api/admin/submissions/${id}/${action}`;
  }

  async function doApprove(verify: boolean) {
    const res = await fetch(approveUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verify }),
    });

    const json = await res.json().catch(() => null);

    if (res.status === 409) {
      toast.error(json?.error ?? "Possible duplicate venue detected.", {
        description: "Review it first or use Approve anyway.",
      });
      return;
    }

    if (!res.ok) {
      toast.error(json?.error ? String(json.error) : "Failed to approve");
      return;
    }

    toast.success("Submission approved", {
      description: verify ? "Venue is now live and verified." : "Venue is now live.",
    });

    router.refresh();
  }

  async function doReject(reason: string) {
    const res = await fetch(`/api/admin/submissions/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      toast.error(json?.error ? String(json.error) : "Failed to reject");
      return;
    }

    toast.success("Submission rejected", {
      description: reason ? `Reason saved: ${reason}` : "The submission has been rejected.",
    });

    router.refresh();
  }

  function onRejectClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    const ok = window.confirm("Reject this submission?");
    if (!ok) return;

    let reason =
      window.prompt("Optional reject reason (saved for admin reference):") ?? "";
    reason = reason.trim().slice(0, 600);

    startTransition(async () => {
      try {
        await doReject(reason);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to reject");
      }
    });
  }

  function onApproveClick(
    e: React.MouseEvent<HTMLButtonElement>,
    mode: "plain" | "verify"
  ) {
    e.preventDefault();
    e.stopPropagation();

    const approveMsg = force
      ? `Approve anyway${mode === "verify" ? " and verify" : ""}?`
      : `Approve this submission${mode === "verify" ? " and verify" : ""}?`;

    const ok = window.confirm(approveMsg);
    if (!ok) return;

    // ✅ extra popup when clicking normal Approve
    let verify = mode === "verify";
    if (mode === "plain") {
      verify = window.confirm("Would you like to verify now?");
    }

    startTransition(async () => {
      try {
        await doApprove(verify);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to approve");
      }
    });
  }

  // Reject = single button (unchanged)
  if (action === "reject") {
    return (
      <button
        type="button"
        onClick={onRejectClick}
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1 text-sm transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? "Working..." : "Reject"}
      </button>
    );
  }

  // Approve = two buttons
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => onApproveClick(e, "plain")}
        disabled={pending}
        className="rounded-lg border border-emerald-200 px-3 py-1 text-sm transition hover:bg-emerald-50 disabled:opacity-50"
      >
        {pending ? "Working..." : force ? "Approve anyway" : "Approve"}
      </button>

      <button
        type="button"
        onClick={(e) => onApproveClick(e, "verify")}
        disabled={pending}
        className="rounded-lg border border-blue-200 px-3 py-1 text-sm transition hover:bg-blue-50 disabled:opacity-50"
      >
        {pending
          ? "Working..."
          : force
          ? "Approve & Verify anyway"
          : "Approve & Verify"}
      </button>
    </div>
  );
}
