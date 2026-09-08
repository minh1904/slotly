import { ScheduleList } from "@/features/availability/components/schedule-list";
import { SettingsForm } from "@/features/availability/components/settings-form";
import { loadSchedules, loadSettings } from "@/features/availability/loaders";

export default async function AvailabilityPage() {
  const [schedules, settings] = await Promise.all([
    loadSchedules(),
    loadSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Availability</h1>
        <p className="text-muted-foreground">
          Manage your schedules and control buffer/notice guardrails.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <ScheduleList schedules={schedules} />
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
