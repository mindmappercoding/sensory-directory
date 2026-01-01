"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function HideReviewButton({
  reviewId,
  isHidden,
}: {
  reviewId: string;
  isHidden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={isHidden ? "secondary" : "destructive"}
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(`/api/admin/reviews/${reviewId}`, {
            method: "PATCH",
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data?.error ?? "Failed to update review.");
            return;
          }

          router.refresh();
        });
      }}
    >
      {pending ? "Saving..." : isHidden ? "Restore" : "Hide"}
    </Button>
  );
}
