import React, { useState } from 'react';
import { Scan, Finding } from '../types';
import { deleteScan } from '../services/api';
import {
  Activity,
  Globe,
  Search,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ShieldCheck,
  FileText,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ScanHistoryViewProps {
  scans: Scan[];
  onSelectScan: (scan: Scan) => void;
  onNewScan: () => void;
  onScanDeleted?: () => void;
}

export default function ScanHistoryView({
  scans,
  onSelectScan,
  onNewScan,
  onScanDeleted
}: ScanHistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDeleteScan = async () => {
    if (!scanToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteScan(scanToDelete.id);
      setScanToDelete(null);
      if (onScanDeleted) onScanDeleted();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete scan');
    } finally {
      setDeleting(false);
    }
  };

  const filteredScans = scans.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.targetName.toLowerCase().includes(q) ||
      s.targetUrl.toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q)
    );
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (score >= 60) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-red-400 bg-red-950/40 border-red-800/40';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Scan History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit logs and records of all executed automated security assessments.
          </p>
        </div>

        <button
          onClick={onNewScan}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
        >
          <span>Run New Scan</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by target or domain..."
            className="w-full bg-[#0F151C] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Scans Table */}
      <div className="bg-[#0F151C] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        {filteredScans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">No scans found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-400 bg-slate-900/30">
                  <th className="py-3.5 px-5">Target Name & URL</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Severity Breakdown</th>
                  <th className="py-3.5 px-4 text-center">Total Findings</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white">{scan.targetName}</div>
                      <div className="text-xs font-mono text-red-400 truncate max-w-sm">
                        {scan.targetUrl}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(scan.startedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" />
                        {scan.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {scan.severityDistribution.Critical > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 text-[10px] font-bold border border-red-800">
                            {scan.severityDistribution.Critical}C
                          </span>
                        )}
                        {scan.severityDistribution.High > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 text-[10px] font-bold border border-orange-800">
                            {scan.severityDistribution.High}H
                          </span>
                        )}
                        {scan.severityDistribution.Medium > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 text-[10px] font-bold border border-amber-800">
                            {scan.severityDistribution.Medium}M
                          </span>
                        )}
                        {scan.severityDistribution.Low > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 text-[10px] font-bold border border-blue-800">
                            {scan.severityDistribution.Low}L
                          </span>
                        )}
                        {scan.totalFindings === 0 && (
                          <span className="text-xs text-slate-500">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-white">
                      {scan.totalFindings}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(
                          scan.securityScore
                        )}`}
                      >
                        {scan.securityScore}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectScan(scan)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          View Report
                        </button>
                        <button
                          id={`delete-scan-${scan.id}`}
                          onClick={() => {
                            setDeleteError(null);
                            setScanToDelete(scan);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete scan record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Delete Scan Confirmation Modal */}
      {scanToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (!deleting) setScanToDelete(null);
          }}
        >
          <div
            className="bg-[#141C25] border border-[#1E293B] rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Scan Audit Record</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to delete scan record for{' '}
                  <span className="text-white font-semibold">{scanToDelete.targetName}</span> from{' '}
                  <span className="text-slate-300">
                    {new Date(scanToDelete.startedAt).toLocaleDateString()}
                  </span>
                  ?
                </p>
                <p className="text-[11px] text-amber-400/90 pt-1">
                  ⚠️ This action will permanently remove this scan run and its discovered vulnerabilities.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setScanToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-scan-btn"
                type="button"
                disabled={deleting}
                onClick={handleConfirmDeleteScan}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-950/50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Scan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
