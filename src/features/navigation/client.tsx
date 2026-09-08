"use client";

import { LayoutDashboard } from "lucide-react";

import type { NavConfig } from "@/features/navigation/types";

export function useAppNav(): NavConfig {
  return {
    groups: [
      {
        items: [{ label: "Overview", href: "/home", icon: LayoutDashboard }],
      },
    ],
  };
}
