import React, { useState, useEffect, useCallback } from 'react';
import { LogOut } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TargetsView from './components/TargetsView';
import NewScanView from './components/NewScanView';
import ScanHistoryView from './components/ScanHistoryView';
import VulnerabilitiesView from './components/VulnerabilitiesView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import FindingDetailModal from './components/FindingDetailModal';
import AuthView from './components/AuthView';
import {
  fetchDashboardMetrics,
  fetchTargets,
  fetchScans,
  fetchFindings,
  getStoredAuth,
  logoutUser,
  fetchCurrentUser
} from './services/api';
import { DashboardMetrics, Target, Scan, Finding, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredAuth().user);
  const [hasToken, setHasToken] = useState<boolean>(() => !!getStoredAuth().token);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal and drilldown state
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [selectedScanForReport, setSelectedScanForReport] = useState<string | undefined>(undefined);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const handleLogout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    setHasToken(false);
    setTargets([]);
    setScans([]);
    setFindings([]);
    setMetrics(null);
    setActiveTab('dashboard');
  }, []);

  const loadAllData = useCallback(async () => {
    if (!hasToken) return;
    setLoading(true);
    try {
      const [m, t, s, f] = await Promise.all([
        fetchDashboardMetrics(),
        fetchTargets(),
        fetchScans(),
        fetchFindings()
      ]);
      setMetrics(m);
      setTargets(t);
      setScans(s);
      setFindings(f);
    } catch (err: any) {
      console.warn('[VulnX] Error loading dashboard data:', err);
      if (err?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [hasToken, handleLogout]);

  // Handle unauthorized event from Axios interceptor
  useEffect(() => {
    const onUnauthorized = () => {
      handleLogout();
    };
    const onManualLogout = () => {
      setCurrentUser(null);
      setHasToken(false);
    };

    window.addEventListener('vulnx-unauthorized', onUnauthorized);
    window.addEventListener('vulnx-logout', onManualLogout);

    return () => {
      window.removeEventListener('vulnx-unauthorized', onUnauthorized);
      window.removeEventListener('vulnx-logout', onManualLogout);
    };
  }, [handleLogout]);

  // On mount, if token exists, verify token with me endpoint and load data
  useEffect(() => {
    if (hasToken) {
      fetchCurrentUser()
        .then((user) => {
          setCurrentUser(user);
          loadAllData();
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [hasToken, loadAllData, handleLogout]);

  const handleAuthenticated = (user: User) => {
    setCurrentUser(user);
    setHasToken(true);
    setActiveTab('dashboard');
  };

  const handleScanCompleted = (newScan: Scan) => {
    loadAllData();
  };

  const handleSelectScan = (scan: Scan) => {
    setSelectedScanForReport(scan.id);
    setActiveTab('reports');
  };

  const handleScanTarget = (target: Target) => {
    setActiveTab('new-scan');
  };

  const handleFindingUpdated = (updated: Finding) => {
    setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setSelectedFinding(updated);
    // Reload metrics so resolved/open counts update
    fetchDashboardMetrics().then(setMetrics).catch(console.warn);
  };

  // If user is not authenticated, render AuthView
  if (!hasToken || !currentUser) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Application Navbar */}
      <Navbar
        user={currentUser}
        onNewScan={() => setActiveTab('new-scan')}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070a12]">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              loading={loading}
              onNewScan={() => setActiveTab('new-scan')}
              onSelectFinding={(f) => setSelectedFinding(f)}
              onSelectScan={handleSelectScan}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'targets' && (
            <TargetsView
              targets={targets}
              onTargetsUpdated={loadAllData}
              onScanTarget={handleScanTarget}
            />
          )}

          {activeTab === 'new-scan' && (
            <NewScanView
              targets={targets}
              onScanCompleted={handleScanCompleted}
              onSelectFinding={(f) => setSelectedFinding(f)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'scans' && (
            <ScanHistoryView
              scans={scans}
              onSelectScan={handleSelectScan}
              onNewScan={() => setActiveTab('new-scan')}
              onScanDeleted={loadAllData}
            />
          )}

          {activeTab === 'vulnerabilities' && (
            <VulnerabilitiesView
              findings={findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              scans={scans}
              selectedScanId={selectedScanForReport}
              onSelectFinding={(f) => setSelectedFinding(f)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onLogout={() => setShowLogoutModal(true)}
            />
          )}
        </main>
      </div>

      {/* Detail Modal for any finding clicked anywhere in the app */}
      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
        onStatusUpdated={handleFindingUpdated}
      />

      {/* In-App Logout Confirmation Modal (Zero window.confirm, iframe safe) */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/50 flex items-center justify-center text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Sign Out of VulnX Console</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to end your current session as{' '}
                  <span className="text-white font-semibold">{currentUser.email}</span>?
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  You will need to sign in again to access security assessments and reports.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="modal-confirm-logout-btn"
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  handleLogout();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-950/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
