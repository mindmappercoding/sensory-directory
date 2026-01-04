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

export function UserRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: "USER" | "ADMIN";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = React.useState(false);

  const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

  function onClick() {
    setOpen(true);
  }

  function confirm() {
    setOpen(false);

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.error ?? "Failed to update role");
        return;
      }

      toast.success("Role updated", {
        description: `User is now ${nextRole}`,
      });

      router.refresh();
    });
  }

  const isDemote = currentRole === "ADMIN";

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-lg border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        {pending ? "Working…" : isDemote ? "Demote" : "Promote"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDemote ? "Remove admin access?" : "Make this user an admin?"}
            </DialogTitle>
            <DialogDescription>
              {isDemote
                ? "This user will lose access to admin features."
                : "This user will be able to access the admin dashboard and manage data."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={confirm}
              disabled={pending}
              variant={isDemote ? "destructive" : "default"}
            >
              {isDemote ? "Demote to USER" : "Promote to ADMIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
