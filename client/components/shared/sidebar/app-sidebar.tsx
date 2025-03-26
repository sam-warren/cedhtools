"use client";

import {
  HelpCircleIcon,
  LayoutDashboardIcon
} from "lucide-react";

import { NavMain } from "@/components/shared/sidebar/nav-main";
import { NavRecentDecks } from "@/components/shared/sidebar/nav-recent-decks";
import { NavSearch } from "@/components/shared/sidebar/nav-search";
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
              url: "/dashboard",
              icon: LayoutDashboardIcon,
            },
            {
              title: "Support",
              url: "/support",
              icon: HelpCircleIcon,
            },
          ]}
        />
        <NavRecentDecks/>
        <NavUser className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
