"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/app/utils/supabase/client";

type DBUser = {
  id: string;
  subscription_tier: string;
}

export function SiteHeader() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();
      setUser(userData);
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
          <h1 className="text-base font-medium font-mono">cedhtools</h1>
        </div>

        {!loading && user && user.subscription_tier !== "PRO" && (
          <Button asChild size="sm" className="gap-2 bg-indigo-500 dark:text-white">
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
