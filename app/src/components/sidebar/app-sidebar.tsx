"use client";

import { NavFilters } from "@/components/sidebar/nav-filters";
import { NavHeader } from "@/components/sidebar/nav-header";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { LayoutDashboard, Shield, Trophy, Users } from "lucide-react";
import * as React from "react";

const sidebarConfig = {
  user: {
    name: "Sam",
    email: "sam@cedhtools.com",
    avatar: "https://github.com/shadcn.png"
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard
    },
    {
      title: "Commanders",
      url: "/commanders",
      icon: Shield,
      isActive: true
    },
    {
      title: "Tournaments",
      url: "/tournaments",
      icon: Trophy
    },
    {
      title: "Players",
      url: "/players",
      icon: Users
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHeader />
      </SidebarHeader>
      <SidebarContent className="flex h-full flex-col">
        <div>
          <NavMain key="nav-main" items={sidebarConfig.navMain} />
        </div>
        <div className="mt-auto">
          <NavFilters key="nav-filters" />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarConfig.user} isAuthenticated={true} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
