import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileSidebar } from "./MobileSidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <MobileSidebar />
      {/* Content area offset by sidebar min-width */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <TopBar />
        <main className="flex-1 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
