"use client";

import { CommanderSearch } from "@/components/shared/search/commander-search";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export function NavSearch() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="relative">
          <CommanderSearch variant="sidebar" />
        </div>
      </SidebarGroupContent> 
    </SidebarGroup>
  );
}
