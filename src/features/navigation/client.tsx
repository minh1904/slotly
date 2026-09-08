"use client";

import { CalendarClock, LayoutDashboard } from "lucide-react";

import type { NavConfig } from "@/features/navigation/types";

export function useAppNav(): NavConfig {
  return {
    groups: [
      {
        items: [
          { label: "Overview", href: "/home", icon: LayoutDashboard },
          {
            label: "Availability",
            href: "/availability",
            icon: CalendarClock,
          },
        ],
      },
    ],
  };
}
