import React, { useState } from 'react';
import { Finding } from '../types';
import { X, ShieldAlert, CheckCircle2, Globe, Terminal, ShieldCheck, RefreshCw } from 'lucide-react';
import { updateFindingStatus } from '../services/api';

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onStatusUpdated?: (updatedFinding: Finding) => void;
}

export default function FindingDetailModal({
  finding,
  onClose,
  onStatusUpdated
}: FindingDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(finding?.status || 'Open');

  if (!finding) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!finding.id) return;
    setUpdating(true);
    try {
      const updated = await updateFindingStatus(finding.id, newStatus);
      setCurrentStatus(updated.status);
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update finding status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div
      id="finding-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="finding-detail-dialog"
        className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border ${getSeverityStyle(
                  finding.severity
                )}`}
              >
                {finding.severity} Severity
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {finding.category}
              </span>
              <span className="text-xs text-slate-400">
                Confidence: <span className="text-slate-200">{finding.confidence || 'High'}</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{finding.name}</h2>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-5 space-y-5 text-sm">
          {/* Target URL Tested */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-mono">Affected URL:</span>
            <span className="text-xs text-cyan-300 font-mono truncate">{finding.urlTested || 'N/A'}</span>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vulnerability Description
            </h3>
            <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
              {finding.description}
            </p>
          </div>

          {/* Technical Evidence */}
          {finding.evidence && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Technical Evidence & Proof of Concept
              </h3>
              <div className="bg-[#090d16] p-3 rounded-xl border border-slate-800/90 font-mono text-xs text-cyan-200 overflow-x-auto whitespace-pre-wrap break-all">
                {finding.evidence}
              </div>
            </div>
          )}

          {/* Remediation & Recommendation */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Remediation Recommendation
            </h3>
            <div className="text-slate-200 leading-relaxed bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl">
              {finding.recommendation || 'No specific recommendation provided. Follow standard OWASP defense-in-depth practices.'}
            </div>
          </div>
        </div>

        {/* Footer & Status Transition */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Vulnerability Status:</span>
            <select
              value={currentStatus}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Mitigated">Mitigated</option>
              <option value="False Positive">False Positive</option>
            </select>
            {updating && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
          </div>
          <button
            id="modal-done-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
