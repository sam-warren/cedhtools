"use client";

import {
  HelpCircleIcon,
  LayoutDashboardIcon
} from "lucide-react";

import { NavMain } from "@/components/shared/sidebar/nav-main";
import { NavSearch } from "@/components/shared/sidebar/nav-search";
import { NavSecondary } from "@/components/shared/sidebar/nav-secondary";
import { NavUser } from "@/components/shared/sidebar/nav-user";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent className="flex flex-col gap-4">
        <NavSearch />
        <NavMain
          items={[
            {
              title: "Dashboard",
              url: "/",
              icon: LayoutDashboardIcon,
            },
          ]}
        />
        <NavSecondary
          className="mt-auto"
          items={[
            {
              title: "Support",
              url: "/support",
              icon: HelpCircleIcon,
            },
          ]}
        />
        <NavUser />
      </SidebarContent>
    </Sidebar>
  );
}
