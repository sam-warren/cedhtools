"use client";

import { useRotateText } from "@/hooks/use-rotate-text";
import { cn } from "@/lib/utils";

const rotatingTexts = [
  "Unlock powerful insights.",
  "Discover emerging trends.",
  "Track meta evolution.",
  "Master your strategy.",
  "Analyze top performers.",
];

export function Hero() {
  const { text, isAnimating } = useRotateText(rotatingTexts, 5000);

  return (
    <section className="p-8">
      <div className="text-center space-y-4">
        <div className="h-[40px] w-[700px] relative">
          <h1
            className={cn(
              "text-4xl font-bold tracking-tight absolute inset-x-0 transition-all duration-700",
              isAnimating
                ? "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            )}
          >
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
