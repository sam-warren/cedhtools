"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 px-4 lg:px-6 pb-4 lg:pb-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
