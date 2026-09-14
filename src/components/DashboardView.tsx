import React from 'react';
import { DashboardMetrics, Finding, Scan } from '../types';
import {
  ShieldAlert,
  Globe,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  Activity,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onNewScan: () => void;
  onSelectFinding: (finding: Finding) => void;
  onSelectScan: (scan: Scan) => void;
  onNavigateTab: (tab: string) => void;
}

export default function DashboardView({
  metrics,
  loading,
  onNewScan,
  onSelectFinding,
  onSelectScan,
  onNavigateTab
}: DashboardViewProps) {
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-900/60 rounded-2xl border border-slate-800/80"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800/80"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800/80"></div>
          <div className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800/80"></div>
        </div>
      </div>
    );
  }

  // Chart data for Vulnerability Overview
  const chartData = [
    { name: 'Critical', count: metrics.severityDistribution.Critical, color: '#ef4444' },
    { name: 'High', count: metrics.severityDistribution.High, color: '#f97316' },
    { name: 'Medium', count: metrics.severityDistribution.Medium, color: '#f59e0b' },
    { name: 'Low', count: metrics.severityDistribution.Low, color: '#3b82f6' },
    { name: 'Info', count: metrics.severityDistribution.Informational, color: '#64748b' }
  ];

  // Helper for security score coloring
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (score >= 60) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-red-400 bg-red-950/40 border-red-800/40';
  };

  const getSeverityBadge = (severity: string) => {
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 id="dashboard-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            VulnX Security Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor your website security assessments and vulnerabilities.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          id="primary-new-scan-btn"
          onClick={onNewScan}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Security Scan</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Targets Card */}
        <div
          id="summary-targets-card"
          onClick={() => onNavigateTab('targets')}
          className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Targets</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-white tracking-tight">
              {metrics.targetsCount}
            </div>
            <span className="text-xs text-cyan-400 flex items-center gap-1 group-hover:underline">
              View targets <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Monitored target domains</p>
        </div>

        {/* Scans Card */}
        <div
          id="summary-scans-card"
          onClick={() => onNavigateTab('scans')}
          className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Scans</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-white tracking-tight">
              {metrics.scansCount}
            </div>
            <span className="text-xs text-blue-400 flex items-center gap-1 group-hover:underline">
              View history <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Completed security scans</p>
        </div>

        {/* Vulnerabilities Card */}
        <div
          id="summary-vulnerabilities-card"
          onClick={() => onNavigateTab('vulnerabilities')}
          className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 hover:border-amber-500/40 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Vulnerabilities</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-white tracking-tight">
              {metrics.findingsCount}
            </div>
            <span className="text-xs text-amber-400 flex items-center gap-1 group-hover:underline">
              All findings <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Total security findings identified</p>
        </div>

        {/* Security Score Card */}
        <div
          id="summary-score-card"
          className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white tracking-tight">{metrics.overallScore}</span>
              <span className="text-xs font-medium text-slate-500">/ 100</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(metrics.overallScore)}`}>
              {metrics.overallScore >= 80 ? 'Good' : metrics.overallScore >= 60 ? 'Moderate' : 'Needs Action'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Current overall baseline score</p>
        </div>
      </div>

      {/* Main Grid: Vulnerability Overview Chart & Recent Vulnerabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vulnerability Overview (Recharts) */}
        <div className="lg:col-span-6 bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Vulnerability Overview</h2>
              <p className="text-xs text-slate-400">Findings grouped by severity rating</p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {metrics.findingsCount} Total
            </span>
          </div>

          <div className="h-60 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#121929] border border-slate-700 px-3 py-2 rounded-xl text-xs shadow-xl text-white">
                          <span className="font-semibold">{data.name}:</span> {data.count} {data.count === 1 ? 'finding' : 'findings'}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend Tags */}
          <div className="grid grid-cols-5 gap-1.5 pt-4 mt-auto border-t border-slate-800/60 text-center">
            {chartData.map((item) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="text-[11px] text-slate-400 font-medium">{item.name}</span>
                <span className="text-sm font-bold text-white mt-0.5">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Vulnerabilities */}
        <div className="lg:col-span-6 bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Vulnerabilities</h2>
              <p className="text-xs text-slate-400">Latest security issues detected across targets</p>
            </div>
            <button
              onClick={() => onNavigateTab('vulnerabilities')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {metrics.recentFindings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <ShieldCheck className="w-10 h-10 text-emerald-400/60 mb-2" />
                <p className="text-sm text-slate-400">No vulnerabilities detected.</p>
                <p className="text-xs text-slate-500 mt-1">Run a security scan to evaluate target security.</p>
              </div>
            ) : (
              metrics.recentFindings.map((finding, idx) => (
                <div
                  key={finding.id || idx}
                  onClick={() => onSelectFinding(finding)}
                  className="group p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border shrink-0 ${getSeverityBadge(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {finding.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {finding.category} • <span className="font-mono text-slate-400">{finding.urlTested}</span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors shrink-0 flex items-center gap-1">
                    Details
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400" />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="bg-[#0e1422] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Scans</h2>
            <p className="text-xs text-slate-400">Recent automated vulnerability assessment executions</p>
          </div>
          <button
            onClick={() => onNavigateTab('scans')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            All scans <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase font-semibold text-slate-400">
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Last Scan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Findings</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.recentScans.map((scan) => (
                <tr
                  key={scan.id}
                  className="hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{scan.targetName}</div>
                    <div className="text-xs font-mono text-slate-400 truncate max-w-xs">
                      {scan.targetUrl}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(scan.startedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {scan.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-200">
                    {scan.totalFindings}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreColor(
                        scan.securityScore
                      )}`}
                    >
                      {scan.securityScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onSelectScan(scan)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
