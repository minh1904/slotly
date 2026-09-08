import { headers } from "next/headers";
import { redirect } from "next/navigation";

import * as data from "@/features/availability/data";
import { auth } from "@/lib/auth";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session.user.id;
}

export async function loadSchedules() {
  const userId = await requireUserId();
  return data.getSchedules(userId);
}

export async function loadScheduleDetail(scheduleId: string) {
  const userId = await requireUserId();
  const schedule = await data.getSchedule(userId, scheduleId);
  if (!schedule) redirect("/availability");

  const [rules, overrides] = await Promise.all([
    data.getRules(schedule.id),
    data.getOverrides(schedule.id),
  ]);
  return { schedule, rules, overrides };
}

export async function loadSettings() {
  const userId = await requireUserId();
  return data.getSettings(userId);
}
