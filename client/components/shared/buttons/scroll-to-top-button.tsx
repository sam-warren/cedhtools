"use client";

import { Button } from "@/components/ui/button";

interface ScrollToTopButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  children: React.ReactNode;
}

export function ScrollToTopButton({
  size = "lg",
  variant = "outline",
  children,
}: ScrollToTopButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
    >
      {children}
    </Button>
  );
}
