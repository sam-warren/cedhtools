import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import "../styles/globals.css";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "cedhtools",
  description: "Turbocharge your deck."
};

const crumbs = [
  {
    label: "Home",
    href: "/",
    current: true
  }
];

export default function RootLayout({
  children,
  breadcrumbs
}: Readonly<{ children: React.ReactNode; breadcrumbs: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head> */}
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <ThemeProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex w-full flex-col">
              <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                {breadcrumbs}
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 pt-4">{children}</main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
