import React, { useState } from 'react';
import { Target, Scan, Finding } from '../types';
import { executeNewScan } from '../services/api';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  Globe,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface NewScanViewProps {
  targets: Target[];
  onScanCompleted: (scan: Scan) => void;
  onSelectFinding: (finding: Finding) => void;
  onNavigateTab: (tab: string) => void;
}

export default function NewScanView({
  targets,
  onScanCompleted,
  onSelectFinding,
  onNavigateTab
}: NewScanViewProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [scanResult, setScanResult] = useState<Scan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scanSteps = [
    'Verifying HTTPS and SSL/TLS cipher integrity',
    'Auditing HTTP defense headers (CSP, HSTS, X-Frame-Options)',
    'Evaluating cookie security attributes (HttpOnly, Secure, SameSite)',
    'Probing Cross-Origin Resource Sharing (CORS) configurations',
    'Checking server banner disclosures and information leakage',
    'Assessing sensitive file and directory visibility'
  ];

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTargetId(id);
    if (id) {
      const target = targets.find((t) => t.id === id);
      if (target) {
        setCustomUrl(target.url);
      }
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const urlToScan = customUrl.trim();
    if (!urlToScan) {
      setErrorMessage('Please enter or select a valid target URL.');
      return;
    }

    if (!authorizationConfirmed) {
      setErrorMessage('You must confirm that you are authorized to assess this target.');
      return;
    }

    setScanning(true);
    setScanResult(null);
    setActiveStep(0);

    // Visual step progression while API executes
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const matchedTarget = targets.find((t) => t.url === urlToScan || t.id === selectedTargetId);
      const result = await executeNewScan({
        url: urlToScan,
        targetId: matchedTarget?.id,
        targetName: matchedTarget?.name || new URL(urlToScan.startsWith('http') ? urlToScan : `https://${urlToScan}`).hostname
      });

      clearInterval(interval);
      setScanResult(result);
      onScanCompleted(result);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err.response?.data?.error || err.message || 'Scan execution failed');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          New Security Scan
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform an automated preliminary vulnerability assessment against your web target.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200">Scan Error</p>
            <p className="mt-0.5 text-xs text-red-300/90">{errorMessage}</p>
          </div>
        </div>
      )}

      {!scanResult ? (
        <form onSubmit={handleStartScan} className="bg-[#0F151C] border border-[#1E293B] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Step 1: Target Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 text-xs flex items-center justify-center font-bold">1</span>
              Select or Enter Target
            </h2>

            {targets.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Choose from saved targets</label>
                <select
                  value={selectedTargetId}
                  onChange={handleTargetChange}
                  disabled={scanning}
                  className="w-full bg-[#121929] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">-- Select a saved target or enter custom URL below --</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.url})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Target URL to assess</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    if (selectedTargetId) setSelectedTargetId('');
                  }}
                  disabled={scanning}
                  placeholder="https://your-domain.com"
                  className="w-full bg-[#121929] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Examples: <span className="text-slate-400 cursor-pointer hover:underline" onClick={() => setCustomUrl('https://example.com')}>https://example.com</span>, <span className="text-slate-400 cursor-pointer hover:underline" onClick={() => setCustomUrl('https://testsite.local')}>https://testsite.local</span>
              </p>
            </div>
          </div>

          {/* Step 2: Authorization Confirmation */}
          <div className="space-y-3 pt-4 border-t border-slate-800/60">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 text-xs flex items-center justify-center font-bold">2</span>
              Authorization & Consent
            </h2>
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={authorizationConfirmed}
                onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                disabled={scanning}
                className="mt-0.5 w-4 h-4 rounded text-red-500 focus:ring-red-500/20 bg-slate-800 border-slate-600 cursor-pointer"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I confirm that I own this website or have explicit authorization to perform a non-destructive security vulnerability assessment.
              </span>
            </label>
          </div>

          {/* Scanning Progress Status */}
          {scanning && (
            <div className="space-y-4 p-5 rounded-xl bg-red-950/20 border border-red-800/40">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Assessment in progress...</h3>
                  <p className="text-xs text-red-300 font-mono mt-0.5">{scanSteps[activeStep]}</p>
                </div>
              </div>

              {/* Progress bars */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-red-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(95, ((activeStep + 1) / scanSteps.length) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              disabled={scanning}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={scanning || !customUrl.trim() || !authorizationConfirmed}
              className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning Target...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Security Scan</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Completed Scan Results Card */
        <div className="space-y-6">
          <div className="bg-[#0F151C] border border-[#1E293B] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/60">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Scan Completed
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">{scanResult.targetName}</h2>
                <p className="text-xs font-mono text-red-400">{scanResult.targetUrl}</p>
              </div>

              {/* Security Score Box */}
              <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Security Score</div>
                  <div className="text-2xl font-bold text-white">{scanResult.securityScore} <span className="text-xs text-slate-500">/ 100</span></div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-5 border-b border-slate-800/60 text-center">
              <div className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30">
                <div className="text-[11px] text-red-400 font-semibold uppercase">Critical</div>
                <div className="text-xl font-bold text-white mt-1">{scanResult.severityDistribution.Critical}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-900/30">
                <div className="text-[11px] text-orange-400 font-semibold uppercase">High</div>
                <div className="text-xl font-bold text-white mt-1">{scanResult.severityDistribution.High}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30">
                <div className="text-[11px] text-amber-400 font-semibold uppercase">Medium</div>
                <div className="text-xl font-bold text-white mt-1">{scanResult.severityDistribution.Medium}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-950/20 border border-blue-900/30">
                <div className="text-[11px] text-blue-400 font-semibold uppercase">Low</div>
                <div className="text-xl font-bold text-white mt-1">{scanResult.severityDistribution.Low}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Info</div>
                <div className="text-xl font-bold text-white mt-1">{scanResult.severityDistribution.Informational}</div>
              </div>
            </div>

            {/* Findings List */}
            <div className="pt-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Detected Findings ({scanResult.findings.length})</h3>
              {scanResult.findings.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 rounded-xl bg-slate-900/30 text-center">
                  No vulnerabilities detected. All assessed security checks passed!
                </p>
              ) : (
                <div className="space-y-2">
                  {scanResult.findings.map((f, i) => (
                    <div
                      key={f.id || i}
                      onClick={() => onSelectFinding(f)}
                      className="p-3.5 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            f.severity === 'Critical'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : f.severity === 'High'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                              : f.severity === 'Medium'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}>
                            {f.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">{f.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{f.description}</p>
                      </div>
                      <span className="text-xs text-red-400 font-medium shrink-0 flex items-center gap-1">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Scan Another Target</span>
              </button>

              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
