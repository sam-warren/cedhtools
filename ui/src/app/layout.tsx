import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/layout/header";

export const metadata: Metadata = {
  title: "cedhtools",
  description: "Turbocharge your deck.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1 flex items-center justify-center">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
