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
import { useSidebar } from "@/contexts/SidebarContext";
import { getPipelineType } from "@/lib/pipelineConfig";

const navItems = [
  { title: "Dashboard", path: "/app", icon: LayoutDashboard },
  { title: "Accounts", path: "/app/accounts", icon: Users },
  { title: "Customer Lifecycle", path: "/app/pipeline", icon: Kanban },
  { title: "Sentiment", path: "/app/sentiment", icon: Phone },
  { title: "Opportunities", path: "/app/opportunities", icon: DollarSign },
  { title: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { title: "Campaigns", path: "/app/triggers", icon: PlayCircle },
  { title: "Settings", path: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const location = useLocation();
  const vendor = getPipelineType();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-card border-r-2 border-black transition-all duration-200",
        "hidden lg:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo – click anywhere to expand/collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "h-14 flex items-center border-b-2 border-black shrink-0 w-full text-left hover:bg-muted/40 transition-colors",
          collapsed ? "justify-center px-0" : "gap-2.5 px-4"
        )}
      >
        {vendor === "adobe" ? (
          <>
            <img src="/Adobe.png" alt="Adobe" className="w-8 h-8 rounded-lg object-contain bg-white shrink-0 border border-black/10" />
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground tracking-tight line-clamp-1">Adobe</span>
                <span className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase">Health</span>
              </div>
            )}
          </>
        ) : vendor === "crowdstrike" ? (
          <>
            <img src="/crowdstrike.jpg" alt="Crowdstrike" className="w-8 h-8 rounded-lg object-contain bg-white shrink-0 border border-black/10" />
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground tracking-tight line-clamp-1">Crowdstrike</span>
                <span className="text-[10px] font-semibold text-red-600 tracking-wider uppercase">Security</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#FF6B00] rounded-lg border border-black/10">
              <Zap className="h-4 w-4 text-white fill-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-foreground tracking-tight line-clamp-1">Zscaler</span>
                <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">Zero Trust</span>
              </div>
            )}
          </>
        )}
        {!collapsed && (
          <ChevronLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/app" && location.pathname === "/app");

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/app"}
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
