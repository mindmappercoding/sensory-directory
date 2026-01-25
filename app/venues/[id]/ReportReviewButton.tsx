"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";

type Reason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE"
  | "OFF_TOPIC"
  | "MISINFORMATION"
  | "PRIVACY"
  | "OTHER";

const REASONS: { value: Reason; label: string }[] = [
  { value: "SPAM", label: "Spam / advertising" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "HATE", label: "Hate / discrimination" },
  { value: "OFF_TOPIC", label: "Off topic" },
  { value: "MISINFORMATION", label: "Misinformation" },
  { value: "PRIVACY", label: "Privacy issue" },
  { value: "OTHER", label: "Other" },
];

export default function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [reason, setReason] = React.useState<Reason>("SPAM");
  const [message, setMessage] = React.useState("");

  function submit() {
    startTransition(async () => {
      const res = await fetch(`/api/venues/[id]/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          message: message.trim() ? message.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data?.error ?? "Could not submit report.");
        return;
      }

      toast.success("Report sent", {
        description: "Thanks — this helps keep the directory trustworthy.",
      });

      setMessage("");
      setReason("SPAM");
      setOpen(false);
    });
  }

  return (
    <div className="absolute bottom-3 right-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-xl px-3 text-xs hover:bg-background/80"
          >
            <Flag className="h-3 w-3" />
            Report
          </Button>
        </DialogTrigger>

        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              Report this review
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Pick a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Extra details (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                placeholder="Tell us what's wrong (optional)"
                className="min-h-[96px] rounded-2xl"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Your feedback helps us maintain quality
                </span>
                <span className="text-muted-foreground">
                  {message.length}/500
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending} className="rounded-2xl">
              {pending ? "Sending..." : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}