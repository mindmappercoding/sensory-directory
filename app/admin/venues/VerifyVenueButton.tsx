// app/admin/venues/VerifyVenueButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

export function VerifyVenueButton({
  id,
  verified,
}: {
  id: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function toggle() {
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/venues/${id}/${verified ? "unverify" : "verify"}`,
        { method: "POST" }
      );

      if (!res.ok) {
        toast.error("Action failed");
        return;
      }

      toast.success(verified ? "Venue unverified" : "Venue verified", {
        description: "Status updated successfully",
      });

      router.refresh();
    });
  }

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={verified ? "outline" : "default"}
      size="sm"
      className="rounded-2xl"
    >
      {pending ? (
        <>
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Updating…
        </>
      ) : verified ? (
        <>
          <XCircle className="mr-2 h-3.5 w-3.5" />
          Unverify
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          Verify
        </>
      )}
    </Button>
  );
}