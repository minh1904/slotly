import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavUser } from "@/features/auth/components/nav-user";
import { AppSidebar } from "@/features/navigation/components/app-sidebar";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const sidebarState = (await cookies()).get("sidebar_state");

  return (
    <SidebarProvider defaultOpen={sidebarState?.value !== "false"}>
      <AppSidebar footer={<NavUser />} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
