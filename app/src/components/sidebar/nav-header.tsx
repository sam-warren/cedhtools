import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { CEDHToolsIcon } from "../icons/cedhtools-icon";

export function NavHeader() {
  const { state } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/" className="relative flex h-10 w-full items-center overflow-hidden hover:opacity-80">
          <div className="absolute left-1 z-10">
            <CEDHToolsIcon className="size-6" />
          </div>
          <div
            className={`absolute left-8 transition-all duration-300 ease-in-out ${
              state === "expanded" ? "opacity-100" : "opacity-0"
            }`}>
            <span className="font-mono text-lg font-bold">cedhtools</span>
          </div>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
