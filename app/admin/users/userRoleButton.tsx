"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserRoleButton({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: "USER" | "ADMIN";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const nextRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

  function onClick() {
    const ok = window.confirm(
      currentRole === "ADMIN"
        ? "Remove ADMIN from this user?"
        : "Make this user an ADMIN?"
    );
    if (!ok) return;

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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
    >
      {pending ? "Working…" : currentRole === "ADMIN" ? "Demote" : "Promote"}
    </button>
  );
}
