"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Layers } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Analysis } from "@/lib/types/dashboard";

interface DeckAnalysis {
  id: number;
  moxfield_url: string;
  created_at: string;
  deck_name: string | null;
}

interface NavRecentDecksProps {
  className?: string;
}

export function NavRecentDecks({ className }: NavRecentDecksProps) {
  const [recentDecks, setRecentDecks] = useState<DeckAnalysis[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Create Supabase client once
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

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
        // Get recent deck analyses with deck_name
        const { data } = await supabase
          .from("deck_analyses")
          .select(`
            id, 
            moxfield_url, 
            created_at,
            deck_name
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (data) {
          setRecentDecks(data);
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
        (payload) => {
          console.log('Realtime update received:', payload);
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
      <SidebarGroupLabel>Recent Decks</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {recentDecks.map((deck) => {
            const deckId = deck.moxfield_url.split('/').pop();
            // Use deck_name or fallback to the deck ID if not available
            const displayName = deck.deck_name || `Deck ${deckId}`;
            
            return (
              <SidebarMenuItem key={deck.id}>
                <SidebarMenuButton asChild>
                  <Link href={`/deck/${deckId}`}>
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="truncate">{displayName}</span>
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