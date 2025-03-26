"use client";

import { Home, Info, LayoutDashboardIcon, Mail } from "lucide-react";

import { NavMain } from "@/components/shared/sidebar/nav-main";
import { NavRecentDecks } from "@/components/shared/sidebar/nav-recent-decks";
import { NavSearch } from "@/components/shared/sidebar/nav-search";
import { NavUser } from "@/components/shared/sidebar/nav-user";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";

export function AppSidebar() {
  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <NavSearch />
        <NavMain
          items={[
            {
              title: "Home",
              url: "/",
              icon: Home,
            },
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: LayoutDashboardIcon,
            },
          ]}
        />
        <NavRecentDecks />
        <NavSecondary
          className="mt-auto"
          items={[
            {
              title: "About",
              url: "/about",
              icon: Info,
            },
            {
              title: "Contact",
              url: "/contact",
              icon: Mail,
            },
          ]}
        />
        <NavUser />
      </SidebarContent>
    </Sidebar>
  );
}
