"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Reduce refetch interval to minimize unnecessary requests
      refetchInterval={0} // Only refetch when window focuses
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
} 