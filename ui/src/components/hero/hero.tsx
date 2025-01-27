"use client";

export function Hero() {
  return (
    <section className="p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Turbocharge your deck.
        </h1>
        <p className="text-sm text-muted-foreground">
          Press <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">⌘K</kbd> to search for a commander
        </p>
      </div>
    </section>
  );
} 