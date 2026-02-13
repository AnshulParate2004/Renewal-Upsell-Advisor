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
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white border-r border-gray-200 transition-all duration-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center gap-3 px-4 border-b border-gray-200 bg-primary">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white rounded shadow-sm">
          <Zap className="h-6 w-6 text-primary fill-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight leading-none">
              REVENUE
            </span>
            <span className="text-xs font-medium text-white/90 tracking-wider leading-none">
              NAVIGATOR
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app"}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all rounded-lg hover:bg-gray-100 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-primary text-white shadow-sm"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse shadow-sm"></div>
            <span className="text-xs font-medium text-gray-600">System Ready</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
}
