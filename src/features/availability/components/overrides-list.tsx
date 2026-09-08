"use client";

import { Info, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteOverrideAction,
  upsertOverrideAction,
} from "@/features/availability/actions";
import { TimeSelect } from "@/features/availability/components/time-select";
import type { AvailabilityOverrideRow } from "@/features/availability/types";
import { minutesToTime } from "@/features/availability/utils";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function OverridesList({
  scheduleId,
  overrides,
}: {
  scheduleId: string;
  overrides: AvailabilityOverrideRow[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(overrideId: string) {
    setPendingId(overrideId);
    try {
      await deleteOverrideAction(scheduleId, overrideId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove override",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <CardTitle>Date overrides</CardTitle>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="What are date overrides?"
                  className="text-muted-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              }
            />
            <TooltipContent>
              An override fully replaces that date&apos;s weekly hours —
              nothing is merged. Remove it to fall back to the weekly hours
              again.
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          Block a specific date entirely, or give it different hours than
          usual — for holidays or one-off exceptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {overrides.length === 0 ? (
          <p className="text-muted-foreground text-sm">No overrides yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {overrides.map((override) => (
              <li
                key={override.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="font-medium text-sm">
                    {formatDate(override.date)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {override.isBlocked
                      ? "Blocked all day"
                      : override.blocks
                          .map(
                            (block) =>
                              `${minutesToTime(block.startMinute)}–${minutesToTime(block.endMinute)}`,
                          )
                          .join(", ")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pendingId === override.id}
                  onClick={() => handleDelete(override.id)}
                  aria-label="Remove override"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <NewOverrideForm scheduleId={scheduleId} />
      </CardContent>
    </Card>
  );
}

type DraftBlock = { key: string; startTime: string; endTime: string };

function NewOverrideForm({ scheduleId }: { scheduleId: string }) {
  const [date, setDate] = useState("");
  const [isBlocked, setIsBlocked] = useState(true);
  const [blocks, setBlocks] = useState<DraftBlock[]>([
    { key: "1", startTime: "09:00", endTime: "17:00" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function updateBlock(
    key: string,
    field: "startTime" | "endTime",
    value: string,
  ) {
    setBlocks((prev) =>
      prev.map((block) =>
        block.key === key ? { ...block, [field]: value } : block,
      ),
    );
  }

  function addBlock() {
    setBlocks((prev) => [
      ...prev,
      { key: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" },
    ]);
  }

  function removeBlock(key: string) {
    setBlocks((prev) => prev.filter((block) => block.key !== key));
  }

  async function handleSubmit() {
    if (!date) {
      toast.error("Pick a date");
      return;
    }
    setSubmitting(true);
    try {
      await upsertOverrideAction({
        scheduleId,
        date,
        isBlocked,
        blocks: isBlocked
          ? []
          : blocks.map(({ startTime, endTime }) => ({ startTime, endTime })),
      });
      setDate("");
      setIsBlocked(true);
      setBlocks([{ key: "1", startTime: "09:00", endTime: "17:00" }]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save override",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={date}
          min={toDateInputValue(new Date())}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            variant={isBlocked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBlocked(true)}
          >
            Block day
          </Button>
          <Button
            type="button"
            variant={!isBlocked ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBlocked(false)}
          >
            Custom hours
          </Button>
        </div>
      </div>
      {isBlocked ? null : (
        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <div key={block.key} className="flex items-center gap-2">
              <TimeSelect
                value={block.startTime}
                onChange={(value) =>
                  updateBlock(block.key, "startTime", value)
                }
                className="w-28"
              />
              <span className="text-muted-foreground text-sm">–</span>
              <TimeSelect
                value={block.endTime}
                onChange={(value) => updateBlock(block.key, "endTime", value)}
                className="w-28"
              />
              {blocks.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeBlock(block.key)}
                  aria-label="Remove time block"
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={addBlock}
          >
            Add time block
          </Button>
        </div>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={submitting}
          onClick={handleSubmit}
        >
          Save override
        </Button>
      </div>
    </div>
  );
}
