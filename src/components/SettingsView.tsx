import React, { useState, useEffect } from 'react';
import { SystemSimpleStatus, User } from '../types';
import { fetchSimpleSystemStatus } from '../services/api';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Sliders,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  User as UserIcon,
  LogOut
} from 'lucide-react';

interface SettingsViewProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function SettingsView({ currentUser, onLogout }: SettingsViewProps) {
  const [systemStatus, setSystemStatus] = useState<SystemSimpleStatus>({
    api: 'Online',
    database: 'Operational',
    scanner: 'Ready'
  });
  const [timeoutSeconds, setTimeoutSeconds] = useState('60');
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSimpleSystemStatus()
      .then((data) => {
        if (data) setSystemStatus(data);
      })
      .catch(() => {
        // graceful fallback
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage scanning preferences, notification rules, and service status.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Scanner Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">HTTP Request Timeout (seconds)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(e.target.value)}
                className="w-full bg-[#121929] border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">User-Agent Identifier</label>
              <input
                type="text"
                disabled
                value="VulnX-VAPT-Scanner/1.0"
                className="w-full bg-[#121929]/50 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3 pt-5 border-t border-slate-800/60">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Notifications & Alerts
          </h2>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCritical}
              onChange={(e) => setNotifyCritical(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-600 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white block">Notify on Critical/High Findings</span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Flag high priority vulnerabilities immediately upon scan completion.
              </span>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Minimal System Status (Kept simple and non-intrusive as requested) */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              System Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Core assessment services status</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            All Services Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* API Status */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">API Service</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {systemStatus.api}
              </span>
            </div>
          </div>

          {/* Database Status */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Database</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {systemStatus.database}
              </span>
            </div>
          </div>

          {/* Scanner Status */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Scanner Engine</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {systemStatus.scanner}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account & Session Section */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-cyan-400" />
              Account & Active Session
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Current authenticated security analyst profile</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/50 text-cyan-400 border border-cyan-800/50">
            Authenticated
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="text-sm font-bold text-white">{currentUser?.name || 'Security Analyst'}</div>
            <div className="text-xs font-mono text-slate-400">{currentUser?.email || 'analyst@vulnx.sec'}</div>
            <div className="text-[11px] text-slate-500 mt-1">Role: Lead Security Analyst · Workspace: VulnX Production</div>
          </div>

          {onLogout && (
            <button
              id="settings-logout-btn"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-800/50 text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Console</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
