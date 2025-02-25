"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pages</SidebarGroupLabel>
      <SidebarMenu className="overflow-x-hidden">
        {items.map((item) => {
          const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
          const hasActiveChild = item.items?.some(
            (subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/")
          );

          if (!item.items?.length) {
            return (
              <SidebarMenuItem key={item.title} className="transition-[width] duration-200 ease-linear">
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url} className="w-full transition-[width] duration-200 ease-linear">
                    {item.icon && <item.icon />}
                    <span className="transition-[width] duration-200 ease-linear">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive || hasActiveChild}
              className="group/collapsible overflow-hidden">
              <SidebarMenuItem className="transition-[width] duration-200 ease-linear">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                    {item.icon && <item.icon />}
                    <span className="transition-[width] duration-200 ease-linear">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url || pathname.startsWith(subItem.url + "/");
                      return (
                        <SidebarMenuSubItem key={subItem.title} className="transition-[width] duration-200 ease-linear">
                          <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                            <Link href={subItem.url}>
                              <span className="transition-[width] duration-200 ease-linear">{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
