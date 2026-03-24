import {
  Activity,
  LayoutDashboard,
  GitFork,
  Code2,
  Bug,
  TestTube2,
  GitPullRequest,
  ShieldCheck,
  Settings,
  Terminal,
  LogOut,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Navigation structure representing core platform modules.
 * Designed similar to DevSecOps monitoring consoles.
 */
const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },   // ⭐ FIXED
  { title: "Repositories", url: "/repositories", icon: GitFork },
  { title: "Quality Analysis", url: "/analysis", icon: Code2 },
  { title: "Bug Risk Insights", url: "/bug-detection", icon: Bug },
  { title: "Test Coverage", url: "/test-generation", icon: TestTube2 },
  { title: "PR Inspection", url: "/pr-review", icon: GitPullRequest },
  { title: "Security Scan", url: "/security-analysis", icon: ShieldCheck },
  { title: "Scan Timeline", url: "/scan-history", icon: Activity },
  { title: "Platform Settings", url: "/settings", icon: Settings },
];
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Developer";

  const initials = displayName.slice(0, 2).toUpperCase();
  const email = user?.email || "";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      
      {/* Platform Branding */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <Terminal className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide text-foreground">
            CodeSentinel Platform
          </span>
        )}
      </div>

      {/* Navigation */}
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="text-sm">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Section */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0 bg-primary/15 text-primary">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            )}
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {email}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}