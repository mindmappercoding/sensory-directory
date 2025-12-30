// app/admin/venues/VerifyVenueButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

      toast.success(
        verified ? "Venue unverified" : "Venue verified",
        { description: "Status updated successfully" }
      );

      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
    >
      {pending
        ? "Updating…"
        : verified
        ? "Unverify"
        : "Verify"}
    </button>
  );
}
