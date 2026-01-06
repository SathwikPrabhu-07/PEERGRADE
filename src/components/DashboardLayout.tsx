import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  User,
  Menu,
  X,
  GraduationCap,
  Search,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "My Skills", path: "/my-skills" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: Users, label: "Requests", path: "/requests" },
  { icon: Calendar, label: "Sessions", path: "/sessions" },
  { icon: ClipboardList, label: "Assignments", path: "/assignments" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    // ROOT: Full-height flex container for app shell
    <div className="flex min-h-screen w-full bg-background">
      {/* ========== MOBILE HEADER ========== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">PeerGrade</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* ========== MOBILE OVERLAY ========== */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={cn(
          // Base sidebar styles - INLINE for guaranteed application
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
          "bg-card border-r border-border",
          "transform transition-transform duration-300 ease-in-out",
          // Desktop: always visible, Mobile: toggle
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 h-16 px-6 border-b border-border shrink-0">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">PeerGrade</span>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT AREA ========== */}
      {/* This is the key fix: explicit margin-left for sidebar space on desktop */}
      <main className="flex-1 flex flex-col min-h-screen w-full lg:ml-64 pt-16 lg:pt-0">
        {/* Content wrapper with explicit max-width and centering */}
        <div className="flex-1 w-full">
          <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
