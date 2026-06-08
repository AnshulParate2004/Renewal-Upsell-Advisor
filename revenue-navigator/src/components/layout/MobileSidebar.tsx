import { useState } from 'react';
import { X, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Phone,
  DollarSign,
  BarChart3,
  Settings,
  Zap,
  PlayCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPipelineType } from '@/lib/pipelineConfig';

const navItems = [
  { title: "Dashboard", path: "/app", icon: LayoutDashboard },
  { title: "Accounts", path: "/app/accounts", icon: Users },
  { title: "Customer Lifecycle", path: "/app/pipeline", icon: Kanban },
  { title: "Calls", path: "/app/calls", icon: Phone },
  { title: "Opportunities", path: "/app/opportunities", icon: DollarSign },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { title: "Manual Triggers", path: "/app/triggers", icon: PlayCircle },
  { title: "Settings", path: "/app/settings", icon: Settings },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const vendor = getPipelineType();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 bg-card border-r-[0.5px] border-black z-50 lg:hidden flex flex-col shadow-xl"
            >
              <div className="h-16 flex items-center gap-3 px-4 border-b-[0.5px] border-black">
                {vendor === "adobe" ? (
                  <>
                    <img src="/Adobe.png" alt="Adobe" className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white border border-black/10" />
                    <div className="flex flex-col leading-none">
                      <span className="text-base font-bold text-foreground tracking-tight">Adobe</span>
                      <span className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase">Health</span>
                    </div>
                  </>
                ) : vendor === "crowdstrike" ? (
                  <>
                    <img src="/crowdstrike.jpg" alt="Crowdstrike" className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white border border-black/10" />
                    <div className="flex flex-col leading-none">
                      <span className="text-base font-bold text-foreground tracking-tight">Crowdstrike</span>
                      <span className="text-[10px] font-semibold text-red-600 tracking-wider uppercase">Security</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary rounded-xl">
                      <Zap className="h-4.5 w-4.5 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-base font-bold text-foreground tracking-tight">Cloudflare</span>
                      <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">Navigator</span>
                    </div>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/app"}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-xl transition-all hover:bg-muted hover:text-foreground border-[0.5px] border-black",
                      isActive && "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="border-t-[0.5px] border-black px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground font-medium">System Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
