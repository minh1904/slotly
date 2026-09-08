"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/features/auth/client";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NavUser() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return null;
  }

  const { name, email, image } = session.user;

  function signOut() {
    authClient.signOut().then(() => {
      window.location.href = "/login";
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg">
                <Avatar size="sm">
                  {image ? <AvatarImage src={image} alt={name} /> : null}
                  <AvatarFallback>{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col text-left">
                  <span className="truncate font-medium text-sm">{name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {email}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-sm">{name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {email}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
