import { SidebarMenu, SidebarMenuItem, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { CEDHToolsIcon } from "../icons/cedhtools-icon";
import Link from "next/link";

export function NavHeader() {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="relative flex h-10 items-center overflow-hidden">
          <div className="absolute left-1 z-10">
            <CEDHToolsIcon className="size-6" />
          </div>
          <div
            className={`absolute left-8 transition-all duration-300 ease-in-out ${
              state === "expanded" ? "opacity-100" : "opacity-0"
            }`}>
            <span className="font-mono text-lg font-bold">cedhtools</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
