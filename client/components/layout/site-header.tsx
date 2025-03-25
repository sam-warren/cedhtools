"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export function SiteHeader() {
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
    <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium font-mono">
            cedhtools
          </h1>
        </div>
        
        {!loading && user && (
          <Button asChild size="sm" className="gap-1">
            <Link href="/pricing">
              <SparklesIcon className="h-4 w-4" />
              Upgrade to PRO
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
