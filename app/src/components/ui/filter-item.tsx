import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LucideIcon } from "lucide-react";

interface FilterItemProps {
  icon: LucideIcon;
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FilterItem({ icon: Icon, label, tooltip, children, open, onOpenChange }: FilterItemProps) {
  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <SidebarMenuButton tooltip={tooltip}>
            <Icon className="mr-2 h-4 w-4" />
            <span className="truncate">{label}</span>
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          {children}
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
} 