import { Bell, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { SearchDropdown } from "@/components/SearchDropdown";

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-30 h-16 flex items-center justify-between border-b-2 border-black dark:border-white bg-white dark:bg-gray-900 px-6 shadow-[0_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_2px_0px_0px_rgba(255,255,255,0.3)]"
    >
      {/* Search */}
      <SearchDropdown />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-9 w-9 flex items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <Bell className="h-4 w-4 text-black dark:text-white" />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-600 border border-white dark:border-gray-900"
          />
        </motion.button>

        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, rotate: 180 }}
          className="h-9 w-9 flex items-center justify-center border-2 border-black dark:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Sun className="h-4 w-4 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Moon className="h-4 w-4 text-black" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="h-9 w-9 flex items-center justify-center bg-indigo-600 border-2 border-black dark:border-white text-xs font-bold text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] cursor-pointer"
        >
          <User className="h-4 w-4" />
        </motion.div>
      </div>
    </motion.header>
  );
}
