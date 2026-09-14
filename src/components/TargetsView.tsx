import React, { useState } from 'react';
import { Target } from '../types';
import { createTarget, deleteTarget } from '../services/api';
import {
  Globe,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

interface TargetsViewProps {
  targets: Target[];
  onTargetsUpdated: () => void;
  onScanTarget: (target: Target) => void;
}

export default function TargetsView({
  targets,
  onTargetsUpdated,
  onScanTarget
}: TargetsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-app Delete Target confirmation state (avoids blocked window.confirm in iframe)
  const [targetToDelete, setTargetToDelete] = useState<{ id: string; name: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError('Please provide both a target name and website URL.');
      return;
    }
    if (!authorizationConfirmed) {
      setError('Authorization confirmation is required to register target.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createTarget({
        name: name.trim(),
        url: url.trim(),
        authorizationConfirmed
      });
      setName('');
      setUrl('');
      setShowAddModal(false);
      onTargetsUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add target');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTarget(targetToDelete.id);
      setTargetToDelete(null);
      onTargetsUpdated();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete target');
    } finally {
      setDeleting(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return 'text-slate-400 bg-slate-800 border-slate-700';
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (score >= 60) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-red-400 bg-red-950/40 border-red-800/40';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Target Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered web applications and domain endpoints configured for security audits.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Target</span>
        </button>
      </div>

      {/* Targets List */}
      {targets.length === 0 ? (
        <div className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-12 text-center text-slate-400">
          <Globe className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No targets registered yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add a web application or domain URL to monitor vulnerabilities and run scheduled scans.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors"
          >
            Add Your First Target
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((target) => (
            <div
              key={target.id}
              className="bg-[#0e1422] border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  {target.lastScore !== undefined && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(
                        target.lastScore
                      )}`}
                    >
                      {target.lastScore} / 100
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-white text-base truncate">{target.name}</h3>
                <a
                  href={target.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1 mt-1 truncate"
                >
                  <span className="truncate">{target.url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>

                <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Last Scan</span>
                    <span className="font-medium text-slate-300">{target.lastScanned || 'Never'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Scans</span>
                    <span className="font-medium text-slate-300">{target.totalScans || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => onScanTarget(target)}
                  className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Scan Target</span>
                </button>
                <button
                  id={`delete-target-${target.id}`}
                  onClick={() => {
                    setDeleteError(null);
                    setTargetToDelete({ id: target.id, name: target.name, url: target.url });
                  }}
                  className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove target"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Target Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#0f1523] border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add Security Target</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddTarget} className="mt-4 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Target Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Marketing Website"
                  className="w-full bg-[#121929] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Website URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#121929] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                  required
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={authorizationConfirmed}
                  onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-cyan-500 rounded bg-slate-800 border-slate-600 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I confirm that I am authorized to perform security scanning against this domain.
                </span>
              </label>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Iframe-safe, zero window.confirm reliance) */}
      {targetToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (!deleting) setTargetToDelete(null);
          }}
        >
          <div
            className="bg-[#0f1523] border border-red-900/40 rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Security Target</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <span className="text-white font-semibold">{targetToDelete.name}</span> (
                  <span className="font-mono text-cyan-400">{targetToDelete.url}</span>)?
                </p>
                <p className="text-[11px] text-amber-400/90 pt-1">
                  ⚠️ This action will permanently remove this target and cascade-delete all associated scan history, vulnerability findings, and executive reports.
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
                onClick={() => setTargetToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-target-btn"
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-950/50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Target...</span>
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
