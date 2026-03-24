import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";

/**
 * Main application layout shell.
 * Provides sidebar navigation and responsive dashboard workspace.
 */
export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        
        {/* Sidebar Navigation */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header */}
          <header className="h-14 flex items-center justify-between border-b border-border px-6 shrink-0 bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h1 className="text-sm font-semibold tracking-wide text-foreground">
                CodeSentinel Dashboard
              </h1>
            </div>

            <div className="text-xs text-muted-foreground">
              Secure Code Monitoring Platform
            </div>
          </header>

          {/* Routed Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}