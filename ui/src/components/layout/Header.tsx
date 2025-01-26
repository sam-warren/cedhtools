import { Home, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../common/ThemeToggle";

interface HeaderProps {
  showSidebar?: boolean;
}

const Header = ({ showSidebar = false }: HeaderProps) => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
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
  );
};

export default Header; 