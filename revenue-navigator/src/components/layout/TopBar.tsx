import { Bell, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { SearchDropdown } from "@/components/SearchDropdown";

export function TopBar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between border-b-2 border-black bg-card/90 backdrop-blur-sm px-5 shrink-0">
      <SearchDropdown />

      <div className="flex items-center gap-1">
        <button className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors border-[0.5px] border-black">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full" />
        </button>

        <button
          onClick={toggle}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors border-[0.5px] border-black"
          title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
        >
          <AnimatePresence mode="wait">
            {theme === "dark" ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sun className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Moon className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="h-8 w-8 flex items-center justify-center bg-primary rounded-lg text-primary-foreground cursor-pointer ml-1 border-[0.5px] border-black">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    </header>
  );
}
