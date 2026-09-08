import { db } from "@/lib/db";

export function getSchedules(userId: string) {
  return db.schedule.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export function getSchedule(userId: string, scheduleId: string) {
  return db.schedule.findFirst({ where: { id: scheduleId, userId } });
}

export function getRules(scheduleId: string) {
  return db.availabilityRule.findMany({
    where: { scheduleId },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
  });
}

export function getOverrides(
  scheduleId: string,
  range?: { from: Date; to: Date },
) {
  return db.availabilityOverride.findMany({
    where: {
      scheduleId,
      ...(range ? { date: { gte: range.from, lte: range.to } } : {}),
    },
    include: { blocks: { orderBy: { startMinute: "asc" } } },
    orderBy: { date: "asc" },
  });
}

export function getSettings(userId: string) {
  return db.availabilitySettings.findUnique({ where: { userId } });
}
