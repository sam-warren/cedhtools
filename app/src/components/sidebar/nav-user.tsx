"use client";

import { ChevronsUpDown, LogIn, LogOut, Moon, Settings2, Sun, User, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { signOut, useSession } from "next-auth/react";
import { Session } from "next-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { clearAuthData } from "@/services/auth";

function useSessionWithCache() {
  const { data: session, status } = useSession({
    required: false
  });
  const [cachedSession, setCachedSession] = useState<Session | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // On mount, try to load cached session
    try {
      const cached = localStorage.getItem("lastKnownSession");
      if (cached) {
        setCachedSession(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Failed to load cached session:", e);
    }
    setHasInitialized(true);
  }, []);

  useEffect(() => {
    // Update cache when session changes
    if (session?.user) {
      localStorage.setItem("lastKnownSession", JSON.stringify(session));
      setCachedSession(session);
    }
  }, [session]);

  const clearCache = () => {
    localStorage.removeItem("lastKnownSession");
    setCachedSession(null);
  };

  return {
    session: status === "loading" ? cachedSession : session,
    status,
    hasInitialized,
    clearCache
  };
}

function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-0.5 h-3 w-32" />
          </div>
          <Skeleton className="ml-auto h-4 w-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ThemeMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        toggleTheme();
      }}>
      <div className="relative mr-2 h-4 w-4">
        <Sun className="absolute h-4 w-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
      </div>
      <span className="relative inline-flex overflow-hidden">
        <span className="translate-y-0 transition-transform duration-200 ease-in-out dark:translate-y-6">
          Light Theme
        </span>
        <span className="absolute translate-y-6 transition-transform duration-200 ease-in-out dark:translate-y-0">
          Dark Theme
        </span>
      </span>
    </DropdownMenuItem>
  );
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { session, status, hasInitialized, clearCache } = useSessionWithCache();
  const router = useRouter();

  const handleSignOut = async () => {
    clearCache();
    await clearAuthData();
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  // Show skeleton only during initial load
  if (!hasInitialized || (status === "loading" && !session)) {
    return <NavUserSkeleton />;
  }

  // Show guest UI if no session
  if (!session?.user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">G</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Guest</span>
                  <span className="truncate text-xs">Not signed in</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}>
              <Link href="/login">
                <DropdownMenuItem>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/signup">
                <DropdownMenuItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create account
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <ThemeMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const { name, email, image } = session.user;
  const displayName = name || "User";
  const avatarLetter = name ? name.charAt(0).toUpperCase() : "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={image || undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg">{avatarLetter}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={image || undefined} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{avatarLetter}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <ThemeMenuItem />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
