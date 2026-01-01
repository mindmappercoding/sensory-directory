// app/admin/reports/ReportActions.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  reportId: string;
  reviewId: string;
};

export default function ReportActions({ reportId, reviewId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // ✅ Resolve: hide review + mark report RESOLVED
  const handleResolve = () => {
    if (
      !window.confirm(
        "Hide this review and mark the report as resolved?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        // 1) Use your existing PATCH (toggle) endpoint
        const first = await fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          cache: "no-store",
        });

        const firstData = await first.json().catch(() => ({} as any));

        if (!first.ok) {
          toast.error(firstData?.error ?? "Failed to update review visibility.");
          return;
        }

        // 2) Ensure it ends up HIDDEN:
        //    If for some reason it's still not hidden (eg already hidden → toggle shows it),
        //    toggle again. Your API returns { hidden: boolean }.
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

        // 3) Mark the report as RESOLVED
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
    });
  };

  // ✅ Dismiss: keep review up + mark report DISMISSED
  const handleDismiss = () => {
    if (
      !window.confirm(
        "Dismiss this report and keep the review visible?"
      )
    ) {
      return;
    }

    startTransition(async () => {
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
    });
  };

  // ✅ Delete: permanently delete review + close report
  const handleDeleteReview = () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this review? This cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
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

        // Close the report once the review is gone
        const reportRes = await fetch(`/api/admin/review-reports/${reportId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "RESOLVED" }),
          cache: "no-store",
        });

        const reportData = await reportRes.json().catch(() => ({} as any));

        if (!reportRes.ok) {
          toast.error(
            reportData?.error ??
              "Review deleted, but report status failed to update."
          );
          return;
        }

        toast.success("Review deleted", {
          description: "The review has been removed and stats updated.",
        });

        router.refresh();
      } catch {
        toast.error("Something went wrong while deleting the review.");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={handleResolve}
      >
        {pending ? "Working..." : "Resolve (hide review)"}
      </Button>

      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={handleDismiss}
      >
        {pending ? "Working..." : "Dismiss"}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={handleDeleteReview}
      >
        {pending ? "Working..." : "Delete review"}
      </Button>
    </div>
  );
}
