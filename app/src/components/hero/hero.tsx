"use client";

import { useRotateText } from "@/hooks/use-rotate-text";
import { cn } from "@/lib/utils";

const rotatingTexts = [
  "Unlock powerful insights.",
  "Discover emerging trends.",
  "Track meta evolution.",
  "Master your strategy.",
  "Analyze top performers."
];

export function Hero() {
  const { text, isAnimating } = useRotateText(rotatingTexts, 3000);

  return (
    <section className="p-8">
      <div className="space-y-4 text-center">
        <div className="relative h-[40px] w-[700px]">
          <h1
            className={cn(
              "absolute inset-x-0 text-4xl font-bold tracking-tight transition-all duration-700",
              isAnimating ? "-translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            )}>
            {text}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Press{" "}
          <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘ + K
          </kbd>{" "}
          to search for a commander.
        </p>
      </div>
    </section>
  );
}
