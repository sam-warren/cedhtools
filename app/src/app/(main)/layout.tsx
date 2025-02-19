import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "@/lib/styles/globals.css";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "cedhtools",
  description: "Turbocharge your deck."
};

export default function MainLayout({
  children,
  breadcrumbs
}: Readonly<{
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex w-full flex-col">
          <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbs}
          </header>
          <main className="flex flex-1 flex-col p-4 pt-4 xl:pt-8">
            <div className="mx-auto w-full max-w-7xl space-y-8">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
