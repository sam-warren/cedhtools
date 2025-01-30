"use client";

import * as React from "react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";

export function MainNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Commanders</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6">
                  <div className="mb-2 mt-4 text-lg font-medium">Commanders</div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Explore the most powerful and popular commanders in the format.
                  </p>
                </div>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/commanders/top">
                    <div className="text-sm font-medium leading-none">Top Commanders</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      See the highest performing commanders.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/commanders/new">
                    <div className="text-sm font-medium leading-none">New Releases</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Check out recently released commanders
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tournaments</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6">
                  <div className="mb-2 mt-4 text-lg font-medium">Tournaments</div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    View and join upcoming tournaments or browse past events.
                  </p>
                </div>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/tournaments/upcoming">
                    <div className="text-sm font-medium leading-none">Upcoming</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      See all scheduled tournaments
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/tournaments/past">
                    <div className="text-sm font-medium leading-none">Past Events</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Browse previous tournament results
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Players</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6">
                  <div className="mb-2 mt-4 text-lg font-medium">Players</div>
                  <p className="text-sm leading-tight text-muted-foreground">
                    Connect with the community and track player performance.
                  </p>
                </div>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/players/rankings">
                    <div className="text-sm font-medium leading-none">Rankings</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View player rankings and statistics
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    href="/players/search">
                    <div className="text-sm font-medium leading-none">Search</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Find and connect with other players
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
