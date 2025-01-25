import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative h-6 w-6 overflow-hidden p-1.5 text-gray-500 hover:text-gray-700 sm:p-2 dark:text-gray-400 dark:hover:text-gray-200"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Sun
          size={20}
          className={`absolute transition-all duration-300 ${
            isDark ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
          }`}
        />
        <Moon
          size={20}
          className={`absolute transition-all duration-300 ${
            isDark ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
          }`}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
