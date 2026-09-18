import React, { useState } from 'react';
import { Scan, Finding } from '../types';
import { downloadReportPdf } from '../services/api';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface ReportsViewProps {
  scans: Scan[];
  selectedScanId?: string;
  onSelectFinding: (finding: Finding) => void;
}

export default function ReportsView({
  scans,
  selectedScanId,
  onSelectFinding
}: ReportsViewProps) {
  const [activeScanId, setActiveScanId] = useState<string>(
    selectedScanId || (scans.length > 0 ? scans[0].id : '')
  );

  const activeScan = scans.find((s) => s.id === activeScanId) || (scans.length > 0 ? scans[0] : null);

  const handlePrint = () => {
    window.print();
  };

  if (!activeScan) {
    return (
      <div className="bg-[#0F151C] border border-[#1E293B] rounded-2xl p-12 text-center text-slate-400 max-w-4xl mx-auto">
        <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white">No Reports Generated</h3>
        <p className="text-xs text-slate-500 mt-1">
          Complete a security scan to automatically generate an executive VAPT assessment report.
        </p>
      </div>
    );
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (score >= 60) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-red-400 bg-red-950/40 border-red-800/40';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Assessment Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            Executive security assessment summary and remediation reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {scans.length > 1 && (
            <select
              value={activeScanId}
              onChange={(e) => setActiveScanId(e.target.value)}
              className="bg-[#0F151C] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
            >
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.targetName} ({new Date(s.startedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => downloadReportPdf(activeScan.id, `VulnX-Assessment-${activeScan.id}.pdf`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-xs shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-[#0F151C] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800 print:border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 print:text-red-600">
                VulnX VAPT Security Assessment Report
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1 print:text-gray-900">
              {activeScan.targetName}
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1 print:text-gray-600">
              Assessed Target: {activeScan.targetUrl}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end text-xs text-slate-400 print:text-gray-500">
            <span>Report ID: <strong className="font-mono text-slate-200 print:text-black">{activeScan.id}</strong></span>
            <span>Date: <strong>{new Date(activeScan.startedAt).toLocaleDateString()}</strong></span>
            <span>Status: <strong className="text-emerald-400 print:text-green-600">{activeScan.status}</strong></span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-200 flex flex-col justify-between">
            <span className="text-xs text-slate-400 print:text-gray-500 font-semibold uppercase">
              Overall Security Score
            </span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white print:text-gray-900">{activeScan.securityScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className={`self-start px-2 py-0.5 rounded text-[11px] font-semibold border ${getScoreBadge(activeScan.securityScore)}`}>
              {activeScan.securityScore >= 80 ? 'Low Risk' : activeScan.securityScore >= 60 ? 'Moderate Risk' : 'High Risk'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-200 flex flex-col justify-between">
            <span className="text-xs text-slate-400 print:text-gray-500 font-semibold uppercase">
              Total Vulnerabilities
            </span>
            <div className="my-2 text-3xl font-bold text-white print:text-gray-900">
              {activeScan.totalFindings}
            </div>
            <span className="text-xs text-slate-400">
              Identified security misconfigurations
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 print:bg-gray-50 print:border-gray-200 flex flex-col justify-between">
            <span className="text-xs text-slate-400 print:text-gray-500 font-semibold uppercase">
              Severity Distribution
            </span>
            <div className="my-2 flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40 text-xs font-bold print:bg-red-50 print:text-red-700">
                {activeScan.severityDistribution.Critical} Crit
              </span>
              <span className="px-2 py-0.5 rounded bg-orange-950/60 text-orange-400 border border-orange-800/40 text-xs font-bold print:bg-orange-50 print:text-orange-700">
                {activeScan.severityDistribution.High} High
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 text-xs font-bold print:bg-amber-50 print:text-amber-700">
                {activeScan.severityDistribution.Medium} Med
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40 text-xs font-bold print:bg-blue-50 print:text-blue-700">
                {activeScan.severityDistribution.Low} Low
              </span>
            </div>
            <span className="text-xs text-slate-400">Categorized risk findings</span>
          </div>
        </div>

        {/* Detailed Findings Table */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white print:text-gray-900">
            Identified Vulnerabilities & Remediation Steps
          </h3>

          {activeScan.findings.length === 0 ? (
            <p className="p-4 rounded-xl bg-slate-900/40 text-slate-400 text-xs text-center">
              No vulnerabilities detected for this target during assessment.
            </p>
          ) : (
            <div className="space-y-3">
              {activeScan.findings.map((finding, idx) => (
                <div
                  key={finding.id || idx}
                  onClick={() => onSelectFinding(finding)}
                  className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 print:bg-gray-50 print:border-gray-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          finding.severity === 'Critical'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30 print:text-red-700'
                            : finding.severity === 'High'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 print:text-orange-700'
                            : finding.severity === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 print:text-amber-700'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30 print:text-blue-700'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 print:text-gray-900">
                          {finding.name}
                        </span>
                        <span className="text-[11px] text-slate-500 print:text-gray-500">
                          ({finding.category})
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 print:text-gray-700 leading-relaxed">
                        {finding.description}
                      </p>

                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-emerald-400 print:text-green-700 uppercase tracking-wider block">
                          Remediation:
                        </span>
                        <p className="text-xs text-slate-300 print:text-gray-600 mt-0.5">
                          {finding.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
