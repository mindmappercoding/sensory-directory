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
import { Shield, UserMinus, UserPlus } from "lucide-react";

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
      <Button
        type="button"
        onClick={onClick}
        disabled={pending}
        variant={isDemote ? "destructive" : "default"}
        size="sm"
        className="rounded-2xl"
      >
        {pending ? (
          <>
            <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Working…
          </>
        ) : isDemote ? (
          <>
            <UserMinus className="mr-2 h-3.5 w-3.5" />
            Demote
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-3.5 w-3.5" />
            Promote
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDemote ? "bg-red-100" : "bg-emerald-100"
              }`}
            >
              {isDemote ? (
                <UserMinus className="h-6 w-6 text-red-600" />
              ) : (
                <Shield className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <DialogTitle>
              {isDemote ? "Remove admin access?" : "Make this user an admin?"}
            </DialogTitle>
            <DialogDescription>
              {isDemote
                ? "This user will lose access to admin features."
                : "This user will be able to access the admin dashboard and manage data."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={confirm}
              disabled={pending}
              variant={isDemote ? "destructive" : "default"}
              className="rounded-2xl"
            >
              {pending ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Working…
                </>
              ) : isDemote ? (
                <>
                  <UserMinus className="mr-2 h-3.5 w-3.5" />
                  Demote to USER
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-3.5 w-3.5" />
                  Promote to ADMIN
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}