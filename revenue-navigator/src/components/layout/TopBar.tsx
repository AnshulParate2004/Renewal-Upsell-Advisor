import { Search, Bell, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between border-b-2 border-black dark:border-white bg-white dark:bg-gray-900 px-6 shadow-[0_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_2px_0px_0px_rgba(255,255,255,0.3)]">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search accounts, contracts... ⌘K"
          className="h-9 w-full border-2 border-black dark:border-white bg-white dark:bg-gray-800 pl-10 pr-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="relative h-9 w-9 flex items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
          <Bell className="h-4 w-4 text-black dark:text-white" />
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-600 border border-white dark:border-gray-900" />
        </button>

        <button
          onClick={toggle}
          className="h-9 w-9 flex items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-black" />}
        </button>

        <div className="h-9 w-9 flex items-center justify-center bg-indigo-600 border-2 border-black dark:border-white text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
