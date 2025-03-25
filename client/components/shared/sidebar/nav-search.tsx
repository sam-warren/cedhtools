"use client";

import { MoxfieldSearch } from "@/components/shared/search/moxfield-search";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export function NavSearch() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="relative">
          <MoxfieldSearch variant="sidebar" />
        </div>
      </SidebarGroupContent> 
    </SidebarGroup>
  );
} 