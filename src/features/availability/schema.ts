import { z } from "zod";

import { rangesOverlap, timeToMinutes } from "@/features/availability/utils";

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time (HH:mm)");

const dayOfWeekSchema = z.number().int().min(0).max(6);

const blockSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
});

const dayScheduleSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  blocks: z.array(blockSchema),
});

export const weeklyScheduleInputSchema = z
  .object({
    scheduleId: z.string().min(1),
    days: z.array(dayScheduleSchema).length(7),
  })
  .superRefine((data, ctx) => {
    data.days.forEach((day, dayIndex) => {
      const ranges = day.blocks.map((block, blockIndex) => {
        const startMinute = timeToMinutes(block.startTime);
        const endMinute = timeToMinutes(block.endTime);
        if (startMinute >= endMinute) {
          ctx.addIssue({
            code: "custom",
            message: "End time must be after start time",
            path: ["days", dayIndex, "blocks", blockIndex, "endTime"],
          });
        }
        return { startMinute, endMinute };
      });

      if (rangesOverlap(ranges)) {
        ctx.addIssue({
          code: "custom",
          message: "Time blocks overlap on this day",
          path: ["days", dayIndex, "blocks"],
        });
      }
    });
  });
export type WeeklyScheduleInput = z.infer<typeof weeklyScheduleInputSchema>;

export const overrideInputSchema = z
  .object({
    scheduleId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    isBlocked: z.boolean(),
    blocks: z.array(blockSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.isBlocked) {
      if (data.blocks.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: "A blocked date cannot have custom hours",
          path: ["blocks"],
        });
      }
      return;
    }

    if (data.blocks.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one time block, or mark the date as blocked",
        path: ["blocks"],
      });
      return;
    }

    const ranges = data.blocks.map((block, index) => {
      const startMinute = timeToMinutes(block.startTime);
      const endMinute = timeToMinutes(block.endTime);
      if (startMinute >= endMinute) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time",
          path: ["blocks", index, "endTime"],
        });
      }
      return { startMinute, endMinute };
    });

    if (rangesOverlap(ranges)) {
      ctx.addIssue({
        code: "custom",
        message: "Time blocks cannot overlap",
        path: ["blocks"],
      });
    }
  });
export type OverrideInput = z.infer<typeof overrideInputSchema>;

export const settingsInputSchema = z.object({
  bufferBeforeMinutes: z.number().int().min(0),
  bufferAfterMinutes: z.number().int().min(0),
  minNoticeHours: z.number().int().min(0),
  maxAdvanceDays: z.number().int().min(1).nullable(),
});
export type SettingsInput = z.infer<typeof settingsInputSchema>;

const scheduleNameSchema = z.string().min(1, "Name is required").max(100);
const timezoneSchema = z.string().min(1, "Select a timezone");

export const createScheduleInputSchema = z.object({
  name: scheduleNameSchema,
  timezone: timezoneSchema,
});
export type CreateScheduleInput = z.infer<typeof createScheduleInputSchema>;

export const renameScheduleInputSchema = z.object({
  scheduleId: z.string().min(1),
  name: scheduleNameSchema,
});
export type RenameScheduleInput = z.infer<typeof renameScheduleInputSchema>;

export const updateScheduleTimezoneInputSchema = z.object({
  scheduleId: z.string().min(1),
  timezone: timezoneSchema,
});
export type UpdateScheduleTimezoneInput = z.infer<
  typeof updateScheduleTimezoneInputSchema
>;
