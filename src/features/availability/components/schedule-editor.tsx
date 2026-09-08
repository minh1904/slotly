"use client";

import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  deleteScheduleAction,
  renameScheduleAction,
  saveWeeklyScheduleAction,
  setDefaultScheduleAction,
  updateScheduleTimezoneAction,
} from "@/features/availability/actions";
import { TimeSelect } from "@/features/availability/components/time-select";
import type {
  AvailabilityRuleRow,
  ScheduleDetailRow,
} from "@/features/availability/types";
import { minutesToTime, rangesOverlap, timeToMinutes } from "@/features/availability/utils";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "17:00";
const TIMEZONES = Intl.supportedValuesOf("timeZone");

type Block = { key: string; startTime: string; endTime: string };
type WeekState = Block[][];

function initWeekState(rules: AvailabilityRuleRow[]): WeekState {
  const week: WeekState = Array.from({ length: 7 }, () => []);
  for (const rule of rules) {
    week[rule.dayOfWeek].push({
      key: rule.id,
      startTime: minutesToTime(rule.startMinute),
      endTime: minutesToTime(rule.endMinute),
    });
  }
  return week;
}

export function ScheduleEditor({
  schedule,
  rules,
}: {
  schedule: ScheduleDetailRow;
  rules: AvailabilityRuleRow[];
}) {
  const router = useRouter();
  const [week, setWeek] = useState<WeekState>(() => initWeekState(rules));
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState(schedule.name);

  function updateDay(
    dayOfWeek: number,
    updater: (blocks: Block[]) => Block[],
  ) {
    setWeek((prev) => {
      const next = [...prev];
      next[dayOfWeek] = updater(prev[dayOfWeek]);
      return next;
    });
    setIsDirty(true);
  }

  function addBlock(dayOfWeek: number) {
    updateDay(dayOfWeek, (blocks) => [
      ...blocks,
      { key: crypto.randomUUID(), startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    ]);
  }

  function removeBlock(dayOfWeek: number, key: string) {
    updateDay(dayOfWeek, (blocks) => blocks.filter((block) => block.key !== key));
  }

  function updateBlockField(
    dayOfWeek: number,
    key: string,
    field: "startTime" | "endTime",
    value: string,
  ) {
    updateDay(dayOfWeek, (blocks) =>
      blocks.map((block) =>
        block.key === key ? { ...block, [field]: value } : block,
      ),
    );
  }

  function toggleDay(dayOfWeek: number, available: boolean) {
    updateDay(dayOfWeek, () =>
      available
        ? [
            {
              key: crypto.randomUUID(),
              startTime: DEFAULT_START_TIME,
              endTime: DEFAULT_END_TIME,
            },
          ]
        : [],
    );
  }

  function validateWeek(): string | null {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const ranges = week[dayOfWeek].map((block) => ({
        startMinute: timeToMinutes(block.startTime),
        endMinute: timeToMinutes(block.endTime),
      }));
      if (ranges.some((range) => range.startMinute >= range.endMinute)) {
        return `${DAY_LABELS[dayOfWeek]}: end time must be after start time`;
      }
      if (rangesOverlap(ranges)) {
        return `${DAY_LABELS[dayOfWeek]}: time blocks overlap`;
      }
    }
    return null;
  }

  async function handleSave() {
    const validationError = validateWeek();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      await saveWeeklyScheduleAction({
        scheduleId: schedule.id,
        days: week.map((blocks, dayOfWeek) => ({
          dayOfWeek,
          blocks: blocks.map(({ startTime, endTime }) => ({ startTime, endTime })),
        })),
      });
      setIsDirty(false);
      toast.success("Weekly hours saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save weekly hours",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === schedule.name) {
      setName(schedule.name);
      setNameEditing(false);
      return;
    }
    setSavingMeta(true);
    try {
      await renameScheduleAction({ scheduleId: schedule.id, name: trimmed });
      setNameEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not rename schedule",
      );
      setName(schedule.name);
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleSetDefault() {
    setSavingMeta(true);
    try {
      await setDefaultScheduleAction(schedule.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not set as default",
      );
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleDelete() {
    setSavingMeta(true);
    try {
      await deleteScheduleAction(schedule.id);
      router.push("/availability");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete schedule",
      );
      setSavingMeta(false);
    }
  }

  async function handleTimezoneChange(timezone: string) {
    setSavingMeta(true);
    try {
      await updateScheduleTimezoneAction({ scheduleId: schedule.id, timezone });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update timezone",
      );
    } finally {
      setSavingMeta(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/availability"
            aria-label="Back to schedules"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <ArrowLeft />
          </Link>
          {nameEditing ? (
            <Input
              autoFocus
              value={name}
              disabled={savingMeta}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              className="h-9 w-56 font-semibold text-xl"
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-1.5"
              onClick={() => setNameEditing(true)}
            >
              <h1 className="font-semibold text-2xl">{schedule.name}</h1>
              <Pencil className="size-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Set as default</span>
            <Switch
              checked={schedule.isDefault}
              disabled={schedule.isDefault || savingMeta}
              onCheckedChange={handleSetDefault}
              aria-label="Set as default schedule"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={savingMeta}
            onClick={handleDelete}
            aria-label="Delete schedule"
          >
            <Trash2 />
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isDirty || saving}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Weekly hours</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {DAY_LABELS.map((label, dayOfWeek) => {
              const blocks = week[dayOfWeek];
              const isAvailable = blocks.length > 0;
              return (
                <div
                  key={label}
                  className="flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:gap-4"
                >
                  <div className="flex w-28 shrink-0 items-center gap-2 pt-1">
                    <Switch
                      checked={isAvailable}
                      disabled={saving}
                      onCheckedChange={(checked) => toggleDay(dayOfWeek, checked)}
                      aria-label={
                        isAvailable ? `Turn off ${label}` : `Turn on ${label}`
                      }
                    />
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {blocks.length === 0 ? (
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground text-sm">
                          Unavailable
                        </p>
                        <AddBlockButton
                          disabled={saving}
                          onClick={() => addBlock(dayOfWeek)}
                        />
                      </div>
                    ) : (
                      blocks.map((block, index) => (
                        <div key={block.key} className="flex items-center gap-2">
                          <TimeSelect
                            value={block.startTime}
                            disabled={saving}
                            onChange={(value) =>
                              updateBlockField(dayOfWeek, block.key, "startTime", value)
                            }
                            className="w-28"
                          />
                          <span className="text-muted-foreground text-sm">–</span>
                          <TimeSelect
                            value={block.endTime}
                            disabled={saving}
                            onChange={(value) =>
                              updateBlockField(dayOfWeek, block.key, "endTime", value)
                            }
                            className="w-28"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={saving}
                            onClick={() => removeBlock(dayOfWeek, block.key)}
                            aria-label="Remove time block"
                          >
                            <Trash2 />
                          </Button>
                          {index === blocks.length - 1 ? (
                            <AddBlockButton
                              disabled={saving}
                              onClick={() => addBlock(dayOfWeek)}
                            />
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timezone</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              defaultValue={schedule.timezone}
              disabled={savingMeta}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddBlockButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      aria-label="Add time block"
    >
      <Plus />
    </Button>
  );
}
