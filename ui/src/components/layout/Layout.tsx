import { type ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const Layout = ({ children, showSidebar = false }: LayoutProps) => {
  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">
      <Header showSidebar={showSidebar} />
      {/* Main Content */}
      <div
        className={`mt-[60px] mb-[60px] flex flex-1 overflow-hidden ${!showSidebar ? "items-center justify-center" : ""}`}
      >
        <main
          className={`${showSidebar ? "ml-[300px] flex-1 overflow-y-auto p-4" : "w-full max-w-3xl p-4"}`}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
