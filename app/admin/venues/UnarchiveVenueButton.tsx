"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UnarchiveVenueButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(`/api/admin/venues/${id}/unarchive`, { method: "POST" });
          if (!res.ok) {
            toast.error("Could not unarchive venue");
            return;
          }
          toast.success("Venue unarchived");
          router.refresh(); // ✅ real-time state update
        });
      }}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-muted disabled:opacity-60"
    >
      {pending ? "Restoring..." : "Unarchive"}
    </button>
  );
}
