"use client";

import { createBrowserClient } from "@/lib/api/supabase";
import { Layers } from "lucide-react";
import { useEffect, useState } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface DeckAnalysis {
  id: number;
  deck_list: string | null;
  deck_name: string | null;
  created_at: string;
  commanders: {
    name: string;
  } | null;
}

interface NavRecentDecksProps {
  className?: string;
}

export function NavRecentDecks({ className }: NavRecentDecksProps) {
  const [recentDecks, setRecentDecks] = useState<DeckAnalysis[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Create Supabase client once
  const supabase = createBrowserClient();

  // Fetch user first
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      } else {
        setInitialLoading(false);
      }
    }
    
    getUser();
  }, [supabase.auth]);

  // Fetch recent decks whenever userId changes
  useEffect(() => {
    if (!userId) return;
    
    async function fetchRecentDecks() {
      try {
        // Get recent deck analyses with deck_name and commander info
        const { data } = await supabase
          .from("deck_analyses")
          .select(`
            id, 
            deck_list,
            deck_name,
            created_at,
            commanders:commander_id(name)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (data) {
          // Transform the data to match DeckAnalysis type
          const transformedData = data.map((d: Record<string, unknown>) => ({
            id: d.id as number,
            deck_list: d.deck_list as string | null,
            deck_name: d.deck_name as string | null,
            created_at: d.created_at as string,
            commanders: Array.isArray(d.commanders) && d.commanders.length > 0 
              ? { name: (d.commanders[0] as { name: string }).name }
              : null,
          }));
          setRecentDecks(transformedData);
        }
      } catch (error) {
        console.error("Error fetching recent decks:", error);
      } finally {
        setInitialLoading(false);
      }
    }

    fetchRecentDecks();

    // Set up realtime subscription for the current user's deck analyses
    const subscription = supabase
      .channel('deck_analyses_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for inserts, updates, and deletes
          schema: 'public',
          table: 'deck_analyses',
          filter: `user_id=eq.${userId}`, // Only listen for changes to this user's records
        },
        () => {
          // Refresh the deck list when changes occur without setting loading state
          fetchRecentDecks();
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts or userId changes
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase]);

  // Only hide the component during initial load or when there are truly no decks
  if (initialLoading) {
    return null;
  }

  if (recentDecks.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>Recent Analyses</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentDecks.map((deck) => {
            // Use deck_name, then commander name, then fallback
            const displayName = deck.deck_name || 
              deck.commanders?.name || 
              `Analysis ${deck.id}`;
            
            const createdDate = new Date(deck.created_at).toLocaleDateString();
            
            return (
              <SidebarMenuItem key={deck.id}>
                <SidebarMenuButton className="cursor-default">
                  <Layers className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {createdDate}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
