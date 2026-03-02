import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Phone,
  DollarSign,
  BarChart3,
  Settings,
  Zap,
  ChevronLeft,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/app", icon: LayoutDashboard },
  { title: "Accounts", path: "/app/accounts", icon: Users },
  { title: "Renewal Pipeline", path: "/app/pipeline", icon: Kanban },
  { title: "Voice Calls", path: "/app/calls", icon: Phone },
  { title: "Opportunities", path: "/app/opportunities", icon: DollarSign },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { title: "Manual Triggers", path: "/app/triggers", icon: PlayCircle },
  { title: "Settings", path: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card border-r-2 border-black transition-all duration-200",
        "hidden lg:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-14 flex items-center border-b-2 border-black shrink-0",
        collapsed ? "justify-center px-0" : "gap-2.5 px-4"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary rounded-lg">
          <Zap className="h-4 w-4 text-primary-foreground fill-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-foreground tracking-tight">Revenue</span>
            <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">Navigator</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/app" && location.pathname === "/app") ||
            (item.path === "/demo" && location.pathname === "/demo");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app" || item.path === "/demo"}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all border-2 border-transparent",
                collapsed && "justify-center px-0 py-2.5",
                isActive
                  ? "bg-primary text-primary-foreground border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button when collapsed */}
      {collapsed && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center h-8 rounded-lg hover:bg-muted text-muted-foreground transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-black px-4 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] text-muted-foreground">All systems online</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
