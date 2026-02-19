import { useState } from 'react';
import { X, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Kanban, Phone, DollarSign,
  BarChart3, Settings, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: "Dashboard", path: "/app", icon: LayoutDashboard },
  { title: "Accounts", path: "/app/accounts", icon: Users },
  { title: "Renewal Pipeline", path: "/app/pipeline", icon: Kanban },
  { title: "Voice Calls", path: "/app/calls", icon: Phone },
  { title: "Opportunities", path: "/app/opportunities", icon: DollarSign },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { title: "Settings", path: "/app/settings", icon: Settings },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-primary text-white border-2 border-foreground rounded-lg flex items-center justify-center"
        style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-white border-r-4 border-foreground z-50 lg:hidden flex flex-col"
              style={{ boxShadow: "3px 0px 0px 0px hsl(var(--foreground))" }}
            >
              {/* Header */}
              <div className="h-20 flex items-center gap-3 px-4 border-b-4 border-foreground bg-primary">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white border-2 border-foreground rounded-lg" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                  <Zap className="h-6 w-6 text-primary fill-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white tracking-tight leading-none uppercase">
                    REVENUE
                  </span>
                  <span className="text-xs font-black text-white tracking-wider leading-none uppercase">
                    NAVIGATOR
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-auto w-10 h-10 flex items-center justify-center bg-white border-2 border-foreground rounded-lg"
                  style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
                  aria-label="Close menu"
                >
                  <X size={20} className="text-foreground" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/app"}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm font-black text-foreground transition-all border-2 border-foreground rounded-lg uppercase tracking-wider",
                      isActive && "bg-primary text-white"
                    )}
                    style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Status Footer */}
              <div className="border-t-4 border-foreground bg-secondary p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-primary border-2 border-foreground animate-pulse" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}></div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">System Ready</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
