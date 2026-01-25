// app/admin/venues/UnarchiveVenueButton.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArchiveRestore } from "lucide-react";

export function UnarchiveVenueButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(`/api/admin/venues/${id}/unarchive`, {
            method: "POST",
          });
          if (!res.ok) {
            toast.error("Could not unarchive venue");
            return;
          }
          toast.success("Venue unarchived");
          router.refresh();
        });
      }}
      variant="outline"
      size="sm"
      className="rounded-2xl"
    >
      {pending ? (
        <>
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Restoring…
        </>
      ) : (
        <>
          <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
          Unarchive
        </>
      )}
    </Button>
  );
}