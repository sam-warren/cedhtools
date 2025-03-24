"use client";

import {
  BarChartIcon,
  HomeIcon,
  LayoutDashboardIcon,
  Settings2Icon,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent className="flex flex-col gap-4">
        <NavMain
          items={[
            {
              title: "Dashboard",
              url: "/",
              icon: LayoutDashboardIcon,
            },
            {
              title: "Deck Analysis",
              url: "/deck-analysis",
              icon: BarChartIcon,
            },
          ]}
        />
        <NavSecondary
          className="mt-auto"
          items={[
            {
              title: "Home",
              url: "/",
              icon: HomeIcon,
            },
            {
              title: "Settings",
              url: "/",
              icon: Settings2Icon,
            },
          ]}
        />
        <NavUser />
      </SidebarContent>
    </Sidebar>
  );
}
