import type {
  getOverrides,
  getRules,
  getSchedule,
  getSchedules,
  getSettings,
} from "@/features/availability/data";

export type ScheduleRow = Awaited<ReturnType<typeof getSchedules>>[number];
export type ScheduleDetailRow = NonNullable<
  Awaited<ReturnType<typeof getSchedule>>
>;
export type AvailabilityRuleRow = Awaited<ReturnType<typeof getRules>>[number];
export type AvailabilityOverrideRow = Awaited<
  ReturnType<typeof getOverrides>
>[number];
export type AvailabilitySettingsRow = Awaited<ReturnType<typeof getSettings>>;
