"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    }
    
    getUser();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-16 items-center justify-between mx-4 md:mx-8 lg:mx-16">
        {/* Logo - Left */}
        <div className="flex-none">
          <Link
            href="/"
            className="font-bold text-xl flex items-center font-mono"
          >
            cedhtools
          </Link>
        </div>

        {/* Controls - Right */}
        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <Button variant="ghost" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              )}
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
