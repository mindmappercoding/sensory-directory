"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // dialogs
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [approveMode, setApproveMode] = React.useState<"plain" | "verify">(
    "plain"
  );

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  function approveUrl() {
    return force
      ? `/api/admin/submissions/${id}/approve?force=1`
      : `/api/admin/submissions/${id}/approve`;
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

  function onApproveClick(e: React.MouseEvent<HTMLButtonElement>, mode: "plain" | "verify") {
    e.preventDefault();
    e.stopPropagation();

    setApproveMode(mode);
    setApproveOpen(true);
  }

  function onRejectClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    setRejectReason("");
    setRejectOpen(true);
  }

  function confirmApprove(verify: boolean) {
    setApproveOpen(false);

    startTransition(async () => {
      try {
        await doApprove(verify);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to approve");
      }
    });
  }

  function confirmReject() {
    const reason = rejectReason.trim().slice(0, 600);
    setRejectOpen(false);

    startTransition(async () => {
      try {
        await doReject(reason);
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to reject");
      }
    });
  }

  const approveTitle = force ? "Approve anyway?" : "Approve submission?";
  const approveDesc =
    approveMode === "plain"
      ? "Would you like to verify this venue now?"
      : "This will approve the submission and mark the venue as verified.";

  // --- Render buttons ---
  if (action === "reject") {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className="border-red-200 hover:bg-red-50"
          disabled={pending}
          onClick={onRejectClick}
        >
          {pending ? "Working..." : "Reject"}
        </Button>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject submission?</DialogTitle>
              <DialogDescription>
                Optionally add a short reason (saved for admin reference).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={600}
                className="w-full rounded-md border bg-background p-2 text-sm"
                placeholder="E.g. Missing address details, unclear venue name, duplicate listing…"
              />
              <div className="text-xs text-muted-foreground">
                {rejectReason.trim().length}/600
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmReject}
                disabled={pending}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // approve action
  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-emerald-200 hover:bg-emerald-50"
          disabled={pending}
          onClick={(e) => onApproveClick(e, "plain")}
        >
          {pending ? "Working..." : force ? "Approve anyway" : "Approve"}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="border-blue-200 hover:bg-blue-50"
          disabled={pending}
          onClick={(e) => onApproveClick(e, "verify")}
        >
          {pending
            ? "Working..."
            : force
            ? "Approve & verify anyway"
            : "Approve & verify"}
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approveTitle}</DialogTitle>
            <DialogDescription>{approveDesc}</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>

            {approveMode === "plain" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => confirmApprove(false)}
                  disabled={pending}
                >
                  No, just approve
                </Button>
                <Button
                  type="button"
                  onClick={() => confirmApprove(true)}
                  disabled={pending}
                >
                  Yes, verify now
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => confirmApprove(true)}
                disabled={pending}
              >
                Approve & verify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
