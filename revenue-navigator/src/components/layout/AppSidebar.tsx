import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Users, Kanban, Phone, DollarSign,
  BarChart3, Settings, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/app", icon: LayoutDashboard },
  { title: "Accounts", path: "/app/accounts", icon: Users },
  { title: "Renewal Pipeline", path: "/app/pipeline", icon: Kanban },
  { title: "Voice Calls", path: "/app/calls", icon: Phone },
  { title: "Opportunities", path: "/app/opportunities", icon: DollarSign },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { title: "Settings", path: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white dark:bg-gray-900 border-r-2 border-black dark:border-white transition-all duration-200 shadow-[2px_0_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_0_0px_0px_rgba(255,255,255,0.3)]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center gap-2 px-4 border-b-2 border-black dark:border-white bg-indigo-600">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
          <Zap className="h-4 w-4 text-indigo-600" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xs font-black text-white tracking-tight uppercase leading-tight">
              Revenue
            </span>
            <span className="text-[10px] font-bold text-indigo-200 tracking-wider uppercase leading-tight">
              Navigator
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app"}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-black dark:text-white transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-indigo-600 text-white border-l-[4px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="uppercase tracking-wide text-xs">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="border-t-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-[10px] font-black uppercase text-black dark:text-white tracking-wider">System Online</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
