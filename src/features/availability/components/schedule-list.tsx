"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createScheduleAction } from "@/features/availability/actions";
import type { ScheduleRow } from "@/features/availability/types";

export function ScheduleList({ schedules }: { schedules: ScheduleRow[] }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const scheduleId = await createScheduleAction({
        name: trimmed,
        timezone,
      });
      window.location.href = `/availability/${scheduleId}`;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create schedule",
      );
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {schedules.length === 0 ? (
          <p className="text-muted-foreground text-sm">No schedules yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <Link
                  href={`/availability/${schedule.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
                >
                  <span className="font-medium text-sm">{schedule.name}</span>
                  {schedule.isDefault ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
                      Default
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {creating ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <Input
              autoFocus
              placeholder="Schedule name"
              value={name}
              disabled={submitting}
              onChange={(e) => setName(e.target.value)}
              className="w-48"
            />
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleCreate}
            >
              Create
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => {
                setCreating(false);
                setName("");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setCreating(true)}
          >
            <Plus /> New schedule
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
