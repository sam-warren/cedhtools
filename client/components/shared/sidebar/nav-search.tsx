"use client";

import { DeckAnalysisForm } from "@/components/shared/search/deck-analysis-form";
import {
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export function NavSearch() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <div className="relative">
          <DeckAnalysisForm variant="sidebar" />
        </div>
      </SidebarGroupContent> 
    </SidebarGroup>
  );
}
