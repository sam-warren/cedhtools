"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function HomePage() {
  return (
    <div className="container space-y-6">
      <PageHeader title="Dashboard" description="Welcome to cedhtools. View statistics and analyze your decks." />
    </div>
  );
}
