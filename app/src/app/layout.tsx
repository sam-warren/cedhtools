import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Header from "@/components/layout/header";

export const metadata: Metadata = {
  title: "cedhtools",
  description: "Turbocharge your deck."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <ThemeProvider>
          <div
            className="fixed inset-0 -z-50"
            style={{
              backgroundImage: `radial-gradient(hsl(var(--muted)) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
              backgroundPosition: "0 0"
            }}
          />
          <Header />
          <main className="flex flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
