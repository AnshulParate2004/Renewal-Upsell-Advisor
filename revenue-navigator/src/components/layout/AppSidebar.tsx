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
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-white border-r-4 border-foreground transition-all duration-200",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ boxShadow: "3px 0px 0px 0px hsl(var(--foreground))" }}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center gap-3 px-4 border-b-4 border-foreground bg-primary">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white border-2 border-foreground rounded-lg" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
          <Zap className="h-6 w-6 text-primary fill-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tight leading-none uppercase">
              REVENUE
            </span>
            <span className="text-xs font-black text-white tracking-wider leading-none uppercase">
              NAVIGATOR
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/app"}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm font-black text-foreground transition-all border-2 border-foreground rounded-lg uppercase tracking-wider",
              collapsed && "justify-center px-0"
            )}
            style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
            activeClassName="bg-primary text-white"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="border-t-4 border-foreground bg-secondary p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-primary border-2 border-foreground animate-pulse" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}></div>
            <span className="text-xs font-black text-foreground uppercase tracking-wider">System Ready</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-3 w-3 bg-primary border-2 border-foreground animate-pulse" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}></div>
          </div>
        )}
      </div>
    </aside>
  );
}
