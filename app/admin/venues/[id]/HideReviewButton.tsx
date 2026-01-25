"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye } from "lucide-react";

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
      variant={isHidden ? "outline" : "destructive"}
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
      className="rounded-2xl"
    >
      {pending ? (
        <>
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Saving...
        </>
      ) : isHidden ? (
        <>
          <Eye className="mr-2 h-3.5 w-3.5" />
          Restore
        </>
      ) : (
        <>
          <EyeOff className="mr-2 h-3.5 w-3.5" />
          Hide
        </>
      )}
    </Button>
  );
}