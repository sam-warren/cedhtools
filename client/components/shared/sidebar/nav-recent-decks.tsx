"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Layers } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Analysis } from "@/lib/types/dashboard";

export function NavRecentDecks() {
  const [recentDecks, setRecentDecks] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentDecks() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        );

        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          // First query to get the recent distinct deck analyses
          const { data } = await supabase
            .from("deck_analyses")
            .select(`
              id, 
              moxfield_url, 
              created_at,
              commander_id
            `)
            .eq("user_id", user.user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (data && data.length > 0) {
            // Get all the unique commander_ids
            const commanderIds = data.map(deck => deck.commander_id);
            
            // Fetch commander names from the commanders table
            const { data: commanderData } = await supabase
              .from("commanders")
              .select("id, name")
              .in("id", commanderIds);
            
            // Create a map of commander_id to name
            const commanderMap: Record<string, string> = {};
            if (commanderData) {
              commanderData.forEach(commander => {
                commanderMap[commander.id] = commander.name;
              });
            }
            
            // Map decks with their commander names
            const formattedDecks = data.map(deck => ({
              id: deck.id,
              moxfield_url: deck.moxfield_url,
              created_at: deck.created_at,
              commanders: {
                name: commanderMap[deck.commander_id] || "Unknown Commander",
                wins: 0, // We could fetch these if needed
                losses: 0
              }
            }));
            
            setRecentDecks(formattedDecks);
          }
        }
      } catch (error) {
        console.error("Error fetching recent decks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentDecks();
  }, []);

  if (loading || recentDecks.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recent Decks</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentDecks.map((deck) => {
            const deckId = deck.moxfield_url.split('/').pop();
            return (
              <SidebarMenuItem key={deck.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/deck/${deckId}`}>
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="truncate">{deck.commanders.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
} 