// app/admin/reports/ReportActions.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { CheckCircle, X, Trash2, EyeOff } from "lucide-react";

type Props = {
  reportId: string;
  reviewId: string;
};

type ConfirmAction = "resolve" | "dismiss" | "delete" | null;

export default function ReportActions({ reportId, reviewId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<ConfirmAction>(null);

  function openConfirm(next: Exclude<ConfirmAction, null>) {
    setAction(next);
    setOpen(true);
  }

  function closeConfirm() {
    setOpen(false);
    setAction(null);
  }

  async function handleResolve() {
    try {
      const first = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        cache: "no-store",
      });

      const firstData = await first.json().catch(() => ({} as any));

      if (!first.ok) {
        toast.error(firstData?.error ?? "Failed to update review visibility.");
        return;
      }

      if (!firstData.hidden) {
        const second = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          cache: "no-store",
        });

        const secondData = await second.json().catch(() => ({} as any));

        if (!second.ok || !secondData.hidden) {
          toast.error("Couldn't hide the review.");
          return;
        }
      }

      const reportRes = await fetch(`/api/admin/review-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
        cache: "no-store",
      });

      const reportData = await reportRes.json().catch(() => ({} as any));
      if (!reportRes.ok) {
        toast.error(reportData?.error ?? "Failed to update report status.");
        return;
      }

      toast.success("Report resolved", {
        description: "Review is now hidden from the public listing.",
      });

      router.refresh();
    } catch {
      toast.error("Something went wrong while resolving the report.");
    }
  }

  async function handleDismiss() {
    try {
      const res = await fetch(`/api/admin/review-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISMISSED" }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        toast.error(data?.error ?? "Failed to dismiss report.");
        return;
      }

      toast.success("Report dismissed", {
        description: "The review stays visible.",
      });

      router.refresh();
    } catch {
      toast.error("Something went wrong while dismissing the report.");
    }
  }

  async function handleDeleteReview() {
    try {
      const deleteRes = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
        cache: "no-store",
      });

      const deleteData = await deleteRes.json().catch(() => ({} as any));

      if (!deleteRes.ok) {
        toast.error(deleteData?.error ?? "Failed to delete review.");
        return;
      }

      toast.success("Review deleted", {
        description:
          "The review has been removed and venue stats have been updated.",
      });

      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting the review.");
    }
  }

  function onConfirm() {
    if (!action) return;

    closeConfirm();

    startTransition(async () => {
      if (action === "resolve") return handleResolve();
      if (action === "dismiss") return handleDismiss();
      if (action === "delete") return handleDeleteReview();
    });
  }

  const dialogCopy =
    action === "resolve"
      ? {
          title: "Resolve report?",
          description:
            "This will hide the review from the public listing and mark the report as RESOLVED.",
          confirmText: "Resolve & hide review",
          confirmVariant: "default" as const,
          icon: EyeOff,
        }
      : action === "dismiss"
      ? {
          title: "Dismiss report?",
          description:
            "This will keep the review visible and mark the report as DISMISSED.",
          confirmText: "Dismiss report",
          confirmVariant: "outline" as const,
          icon: CheckCircle,
        }
      : action === "delete"
      ? {
          title: "Delete review permanently?",
          description:
            "This will permanently delete the review. This action cannot be undone.",
          confirmText: "Delete review",
          confirmVariant: "destructive" as const,
          icon: Trash2,
        }
      : {
          title: "",
          description: "",
          confirmText: "Confirm",
          confirmVariant: "default" as const,
          icon: CheckCircle,
        };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={pending}
          onClick={() => openConfirm("resolve")}
          className="rounded-2xl"
        >
          {pending ? (
            <>
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Working...
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-3.5 w-3.5" />
              Resolve (hide review)
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => openConfirm("dismiss")}
          className="rounded-2xl"
        >
          {pending ? (
            <>
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Working...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-3.5 w-3.5" />
              Dismiss (keep review)
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => openConfirm("delete")}
          className="rounded-2xl"
        >
          {pending ? (
            <>
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Working...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete review
            </>
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(v) => (pending ? null : setOpen(v))}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              {React.createElement(dialogCopy.icon, {
                className: "h-6 w-6 text-primary",
              })}
            </div>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription>{dialogCopy.description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeConfirm}
              disabled={pending}
              className="rounded-2xl"
            >
              <X className="mr-2 h-3.5 w-3.5" />
              Cancel
            </Button>

            <Button
              type="button"
              variant={dialogCopy.confirmVariant}
              onClick={onConfirm}
              disabled={pending}
              className="rounded-2xl"
            >
              {pending ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Working...
                </>
              ) : (
                dialogCopy.confirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}