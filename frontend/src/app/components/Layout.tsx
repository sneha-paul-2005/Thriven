import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Navigate } from 'react-router';
import { LayoutDashboard, Target, Sparkles, Settings, LogOut, Bell, User, Menu, X, Award, Rocket, Users, Briefcase } from 'lucide-react';
import { NavItem } from './NavItem';
import { LogoIcon } from './LogoIcon';
import { ThemeToggle } from './ThemeToggle';
import { api, getToken, getStartupName, removeToken, isLoggedIn, setDisplayName } from '../services/api';

export function Layout() {
  const navigate = useNavigate();
  const [displayName, setName] = useState(getStartupName() || '');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Refresh the name when Settings saves
    const onUpdate = () => setName(getStartupName() || '');
    window.addEventListener('thriven-profile-updated', onUpdate);

    // Sync once on load so the top bar always matches the saved profile
    const token = getToken();
    if (token) {
      api
        .getProfile(token)
        .then((p: any) => {
          if (p?.display_name) setDisplayName(p.display_name);
        })
        .catch(() => {});
    }

    return () => window.removeEventListener('thriven-profile-updated', onUpdate);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // No token = no app. Stops logged-out visitors from seeing placeholder data.
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="glass-panel w-64 flex-shrink-0 transition-all duration-300 border-r-0">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <LogoIcon className="w-5 h-5 text-sidebar-primary-foreground" />
                </div>
                <span className="text-xl font-semibold text-sidebar-foreground">THRIVEN</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-sidebar-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
              <NavItem icon={Target} label="Funnel" to="/funnel" />
              <NavItem icon={Award} label="Benchmark" to="/benchmark" />
              <NavItem icon={Rocket} label="Simulation" to="/simulation" />
              <NavItem icon={Users} label="Cohorts" to="/cohorts" />
              <NavItem icon={Briefcase} label="VC View" to="/vc-dashboard" />
              <NavItem icon={Sparkles} label="AI Assistant" to="/ai-assistant" />
              <NavItem icon={Settings} label="Settings" to="/settings" />
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-sidebar-border">
              <NavItem icon={LogOut} label="Logout" to="/" onClick={handleLogout} />
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="glass-panel border-t-0 border-x-0 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <h2 className="text-xl font-semibold text-foreground truncate">
                {displayName || 'My Startup'}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}