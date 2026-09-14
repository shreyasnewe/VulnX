import React from 'react';
import { ShieldAlert, Plus, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user?: User | null;
  onNewScan: () => void;
  onNavigateTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onNewScan, onNavigateTab, onLogout }) => {
  const displayName = user?.name || 'Security Analyst';
  const displayEmail = user?.email || 'analyst@vulnx.sec';
  const initial = (user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase();

  return (
    <header className="border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => onNavigateTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-base text-white">
              Vuln<span className="text-cyan-400">X</span>
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline ml-2 pl-2 border-l border-slate-700/80">
              Vulnerability Assessment Platform
            </span>
          </div>
        </div>

        {/* Right: Actions and User Account */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick New Scan Button */}
          <button
            id="navbar-new-scan-btn"
            onClick={onNewScan}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Scan</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 font-semibold text-xs">
              {initial}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">
                {displayEmail}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {displayName}
              </div>
            </div>
          </div>

          {/* Dedicated Navbar Logout Button */}
          {onLogout && (
            <button
              id="navbar-logout-btn"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-medium border border-slate-700/60 transition-colors cursor-pointer"
              title="Sign out of VulnX"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
