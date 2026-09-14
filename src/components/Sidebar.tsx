import React from 'react';
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  Clock,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'targets', label: 'Targets', icon: Globe },
    { id: 'new-scan', label: 'New Scan', icon: PlusCircle },
    { id: 'scans', label: 'Scan History', icon: Clock },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-64 border-r border-slate-800/80 bg-[#090d16] flex flex-col justify-between shrink-0 p-4 select-none"
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 px-2 py-1 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight flex items-center gap-1">
              Vuln<span className="text-cyan-400">X</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Security Platform</div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-slate-950 stroke-[2.5]'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation: Settings & Logout */}
      <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
        <button
          id="sidebar-nav-settings"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        <button
          id="sidebar-nav-logout"
          onClick={() => {
            if (onLogout) onLogout();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
