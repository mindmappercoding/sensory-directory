// app/admin/venues/ArchiveVenueButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ArchiveVenueButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function archive() {
    const ok = confirm("Archive this venue? It will no longer be public.");
    if (!ok) return;

    startTransition(async () => {
      const res = await fetch(`/api/admin/venues/${id}/archive`, {
        method: "POST",
      });

      if (!res.ok) {
        toast.error("Failed to archive venue");
        return;
      }

      toast.success("Venue archived", {
        description: "The venue has been hidden from public listings",
      });

      router.refresh();
    });
  }

  return (
    <button
      onClick={archive}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {pending ? "Archiving…" : "Archive"}
    </button>
  );
}
