import { Bell, LogOut, Sun, Moon } from "lucide-react";
import { useRevenue } from "@/contexts/RevenueContext";
import { useAuth } from "@/contexts/AuthContext";
import { SearchDropdown } from "@/components/SearchDropdown";

export function TopBar() {
  const { revenueType, setRevenueType } = useRevenue();
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between border-b-2 border-black bg-card/90 backdrop-blur-sm px-5 shrink-0">
      <SearchDropdown />

      <div className="flex items-center gap-2">
        <div className="flex bg-muted rounded-lg p-0.5 border-[0.5px] border-black h-8 shrink-0 mx-1">
          <button
            onClick={() => setRevenueType('ARR')}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-colors ${revenueType === 'ARR' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`}
          >
            Annual
          </button>
          <button
            onClick={() => setRevenueType('MRR')}
            className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-colors ${revenueType === 'MRR' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-black/5'}`}
          >
            Monthly
          </button>
        </div>

        <button className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors border-[0.5px] border-black">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full" />
        </button>

        <button
          onClick={logout}
          className="h-8 flex items-center justify-center gap-2 px-3 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors border-[0.5px] border-red-200 hover:border-red-600 hover:shadow-sm"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-wider">LOGOUT</span>
        </button>
      </div>
    </header>
  );
}
