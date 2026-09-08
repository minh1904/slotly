import type {
  CreateScheduleInput,
  OverrideInput,
  RenameScheduleInput,
  SettingsInput,
  UpdateScheduleTimezoneInput,
  WeeklyScheduleInput,
} from "@/features/availability/schema";
import { timeToMinutes } from "@/features/availability/utils";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

async function assertScheduleOwnership(
  tx: Prisma.TransactionClient,
  userId: string,
  scheduleId: string,
) {
  const schedule = await tx.schedule.findFirst({
    where: { id: scheduleId, userId },
  });
  if (!schedule) throw new Error("Schedule not found");
  return schedule;
}

export async function createSchedule(
  userId: string,
  input: CreateScheduleInput,
) {
  return db.$transaction(async (tx) => {
    const existingCount = await tx.schedule.count({ where: { userId } });
    return tx.schedule.create({
      data: {
        userId,
        name: input.name,
        timezone: input.timezone,
        isDefault: existingCount === 0,
      },
    });
  });
}

export async function renameSchedule(
  userId: string,
  input: RenameScheduleInput,
) {
  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, input.scheduleId);
    return tx.schedule.update({
      where: { id: input.scheduleId },
      data: { name: input.name },
    });
  });
}

export async function updateScheduleTimezone(
  userId: string,
  input: UpdateScheduleTimezoneInput,
) {
  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, input.scheduleId);
    return tx.schedule.update({
      where: { id: input.scheduleId },
      data: { timezone: input.timezone },
    });
  });
}

export async function setDefaultSchedule(userId: string, scheduleId: string) {
  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, scheduleId);
    await tx.schedule.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return tx.schedule.update({
      where: { id: scheduleId },
      data: { isDefault: true },
    });
  });
}

export async function deleteSchedule(userId: string, scheduleId: string) {
  return db.$transaction(async (tx) => {
    const schedule = await assertScheduleOwnership(tx, userId, scheduleId);
    await tx.schedule.delete({ where: { id: scheduleId } });

    if (schedule.isDefault) {
      const next = await tx.schedule.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await tx.schedule.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

export async function saveWeeklySchedule(
  userId: string,
  input: WeeklyScheduleInput,
) {
  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, input.scheduleId);

    for (const day of input.days) {
      await tx.availabilityRule.deleteMany({
        where: { scheduleId: input.scheduleId, dayOfWeek: day.dayOfWeek },
      });
      if (day.blocks.length > 0) {
        await tx.availabilityRule.createMany({
          data: day.blocks.map((block) => ({
            scheduleId: input.scheduleId,
            dayOfWeek: day.dayOfWeek,
            startMinute: timeToMinutes(block.startTime),
            endMinute: timeToMinutes(block.endTime),
          })),
        });
      }
    }
  });
}

export async function upsertOverride(userId: string, input: OverrideInput) {
  const date = new Date(`${input.date}T00:00:00.000Z`);

  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, input.scheduleId);

    const override = await tx.availabilityOverride.upsert({
      where: { scheduleId_date: { scheduleId: input.scheduleId, date } },
      create: { scheduleId: input.scheduleId, date, isBlocked: input.isBlocked },
      update: { isBlocked: input.isBlocked },
    });

    await tx.availabilityOverrideBlock.deleteMany({
      where: { overrideId: override.id },
    });

    if (!input.isBlocked && input.blocks.length > 0) {
      await tx.availabilityOverrideBlock.createMany({
        data: input.blocks.map((block) => ({
          overrideId: override.id,
          startMinute: timeToMinutes(block.startTime),
          endMinute: timeToMinutes(block.endTime),
        })),
      });
    }

    return override;
  });
}

export async function deleteOverride(
  userId: string,
  scheduleId: string,
  overrideId: string,
) {
  return db.$transaction(async (tx) => {
    await assertScheduleOwnership(tx, userId, scheduleId);
    const result = await tx.availabilityOverride.deleteMany({
      where: { id: overrideId, scheduleId },
    });
    if (result.count === 0) throw new Error("Override not found");
  });
}

export function updateSettings(userId: string, input: SettingsInput) {
  return db.availabilitySettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  });
}
