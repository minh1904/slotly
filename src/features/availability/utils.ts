export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatTime12Hour(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

const TIME_STEP_MINUTES = 15;

export const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: (24 * 60) / TIME_STEP_MINUTES },
  (_, index) => {
    const totalMinutes = index * TIME_STEP_MINUTES;
    return {
      value: minutesToTime(totalMinutes),
      label: formatTime12Hour(totalMinutes),
    };
  },
);

export type MinuteRange = { startMinute: number; endMinute: number };

// Overlap check assumes each range's startMinute < endMinute already holds.
export function rangesOverlap(ranges: MinuteRange[]): boolean {
  const sorted = [...ranges].sort((a, b) => a.startMinute - b.startMinute);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startMinute < sorted[i - 1].endMinute) return true;
  }
  return false;
}
