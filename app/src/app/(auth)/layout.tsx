import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen">
      {/* Grid background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      <div className="fixed left-8 top-8 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
          Back to cedhtools
        </Link>
      </div>
      <main className="flex min-h-screen items-center justify-center">{children}</main>
    </div>
  );
}
