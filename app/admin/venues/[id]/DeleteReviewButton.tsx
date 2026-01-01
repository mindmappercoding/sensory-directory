"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        const ok = window.confirm(
          "Delete this review? This cannot be undone."
        );
        if (!ok) return;

        startTransition(async () => {
          const res = await fetch(`/api/admin/reviews/${reviewId}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data?.error ?? "Failed to delete review.");
            return;
          }

          router.refresh();
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
