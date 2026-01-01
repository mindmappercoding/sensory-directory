"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignIn() {
  const { data, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" disabled>
        Loading…
      </Button>
    );
  }

  if (!data?.user) {
    return (
      <Button className="rounded-xl" onClick={() => signIn("google")}>
        Sign in
      </Button>
    );
  }

  const name = data.user.name || data.user.email || "Signed in";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs text-muted-foreground">
        Signed in as {name}
      </span>
      <Button variant="secondary" className="rounded-xl" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  );
}
