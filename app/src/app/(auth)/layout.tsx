"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="fixed left-8 top-8 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          Back to cedhtools
        </Link>
      </div>
      <main className="flex flex-1">{children}</main>
    </div>
  );
}
