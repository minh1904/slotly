import { OverridesList } from "@/features/availability/components/overrides-list";
import { ScheduleEditor } from "@/features/availability/components/schedule-editor";
import { loadScheduleDetail } from "@/features/availability/loaders";

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const { scheduleId } = await params;
  const { schedule, rules, overrides } = await loadScheduleDetail(scheduleId);

  return (
    <div className="flex flex-col gap-6">
      <ScheduleEditor schedule={schedule} rules={rules} />
      <OverridesList scheduleId={schedule.id} overrides={overrides} />
    </div>
  );
}
