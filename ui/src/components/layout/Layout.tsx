import { type ReactNode } from "react";
import ThemeToggle from "../common/ThemeToggle";
import { Home, Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const Layout = ({ children, showSidebar = false }: LayoutProps) => {
  return (
    <div className="flex h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
    
      {/* Fixed Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-900 dark:text-white">
              <Home className="h-6 w-6" />
            </Link>
            {showSidebar && (
              <button className="text-gray-900 lg:hidden dark:text-white">
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`mt-[60px] mb-[60px] flex flex-1 overflow-hidden ${!showSidebar ? "items-center justify-center" : ""}`}
      >
        {/* Main Content Area */}
        <main
          className={`${showSidebar ? "ml-[300px] flex-1 overflow-y-auto p-4" : "w-full max-w-3xl p-4"}`}
        >
          {children}
        </main>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          © 2025 cEDH Tools
        </p>
      </footer>
    </div>
  );
};

export default Layout;
