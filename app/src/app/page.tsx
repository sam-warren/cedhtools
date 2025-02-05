import { Hero } from "@/components/hero/hero";
import Header from "@/components/layout/header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center">
        <Hero />
      </main>
    </div>
  );
}
