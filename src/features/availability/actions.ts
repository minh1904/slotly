"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import * as mutations from "@/features/availability/mutations";
import {
  type CreateScheduleInput,
  createScheduleInputSchema,
  type OverrideInput,
  overrideInputSchema,
  type RenameScheduleInput,
  renameScheduleInputSchema,
  type SettingsInput,
  settingsInputSchema,
  type UpdateScheduleTimezoneInput,
  updateScheduleTimezoneInputSchema,
  type WeeklyScheduleInput,
  weeklyScheduleInputSchema,
} from "@/features/availability/schema";
import { auth } from "@/lib/auth";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createScheduleAction(input: CreateScheduleInput) {
  const userId = await requireUserId();
  const parsed = createScheduleInputSchema.parse(input);
  const schedule = await mutations.createSchedule(userId, parsed);
  revalidatePath("/availability");
  return schedule.id;
}

export async function renameScheduleAction(input: RenameScheduleInput) {
  const userId = await requireUserId();
  const parsed = renameScheduleInputSchema.parse(input);
  await mutations.renameSchedule(userId, parsed);
  revalidatePath("/availability");
  revalidatePath(`/availability/${parsed.scheduleId}`);
}

export async function updateScheduleTimezoneAction(
  input: UpdateScheduleTimezoneInput,
) {
  const userId = await requireUserId();
  const parsed = updateScheduleTimezoneInputSchema.parse(input);
  await mutations.updateScheduleTimezone(userId, parsed);
  revalidatePath(`/availability/${parsed.scheduleId}`);
}

export async function setDefaultScheduleAction(scheduleId: string) {
  const userId = await requireUserId();
  await mutations.setDefaultSchedule(userId, scheduleId);
  revalidatePath("/availability");
  revalidatePath(`/availability/${scheduleId}`);
}

export async function deleteScheduleAction(scheduleId: string) {
  const userId = await requireUserId();
  await mutations.deleteSchedule(userId, scheduleId);
  revalidatePath("/availability");
}

export async function saveWeeklyScheduleAction(input: WeeklyScheduleInput) {
  const userId = await requireUserId();
  const parsed = weeklyScheduleInputSchema.parse(input);
  await mutations.saveWeeklySchedule(userId, parsed);
  revalidatePath(`/availability/${parsed.scheduleId}`);
}

export async function upsertOverrideAction(input: OverrideInput) {
  const userId = await requireUserId();
  const parsed = overrideInputSchema.parse(input);
  await mutations.upsertOverride(userId, parsed);
  revalidatePath(`/availability/${parsed.scheduleId}`);
}

export async function deleteOverrideAction(
  scheduleId: string,
  overrideId: string,
) {
  const userId = await requireUserId();
  await mutations.deleteOverride(userId, scheduleId, overrideId);
  revalidatePath(`/availability/${scheduleId}`);
}

export async function updateSettingsAction(input: SettingsInput) {
  const userId = await requireUserId();
  const parsed = settingsInputSchema.parse(input);
  await mutations.updateSettings(userId, parsed);
  revalidatePath("/availability");
}
