import { Bell, User, Sun, Moon, Database } from "lucide-react";
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
      className="sticky top-0 z-30 h-16 flex items-center justify-between border-b-4 border-foreground bg-white px-8 overflow-hidden"
      style={{ boxShadow: "0px 2px 0px 0px hsl(var(--foreground))" }}
    >
      {/* Search & Meta */}
      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-foreground text-white border-2 border-foreground rounded-lg text-[9px] font-black uppercase tracking-widest italic overflow-hidden w-48" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
          <div className="flex animate-marquee gap-4 bg-foreground">
            <span className="whitespace-nowrap">★ SYSTEM_CORE: ONLINE // ENCRYPTION: ACTIVE ★</span>
            <span className="whitespace-nowrap">★ SYSTEM_CORE: ONLINE // ENCRYPTION: ACTIVE ★</span>
          </div>
        </div>
        <SearchDropdown />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative h-10 w-10 flex items-center justify-center bg-white border-2 border-foreground rounded-lg"
          style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
        >
          <Bell className="h-5 w-5 text-foreground" />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -right-1 -top-1 h-3 w-3 bg-destructive border-2 border-foreground rounded-full"
            style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
          />
        </motion.button>

        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98, rotate: 180 }}
          className="h-10 w-10 flex items-center justify-center bg-white border-2 border-foreground rounded-lg"
          style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
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
                <Sun className="h-5 w-5 text-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Moon className="h-5 w-5 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="h-10 w-10 flex items-center justify-center bg-primary border-2 border-foreground rounded-lg text-xs font-black text-white cursor-pointer transition-all"
          style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
        >
          <User className="h-5 w-5" />
        </motion.div>
      </div>
    </motion.header>
  );
}
