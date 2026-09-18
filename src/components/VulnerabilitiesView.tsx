import React, { useState } from 'react';
import { Finding, SeverityLevel } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  Globe,
  ChevronRight,
  ShieldAlert,
  Terminal,
  CheckCircle2
} from 'lucide-react';

interface VulnerabilitiesViewProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
}

export default function VulnerabilitiesView({
  findings,
  onSelectFinding
}: VulnerabilitiesViewProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low', 'Informational'];

  const filteredFindings = findings.filter((f) => {
    const matchesSeverity =
      selectedSeverity === 'All' || f.severity.toLowerCase() === selectedSeverity.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.urlTested.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800/60">
        <h1 className="text-2xl font-bold tracking-tight text-white">Vulnerabilities Explorer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, filter, and remediate security issues identified across all scanned assets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {severities.map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSeverity === sev
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'bg-[#0F151C] border border-[#1E293B] text-slate-300 hover:border-slate-700'
              }`}
            >
              {sev}
              {sev !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  (
                  {
                    findings.filter(
                      (f) => f.severity.toLowerCase() === sev.toLowerCase()
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vulnerabilities..."
            className="w-full bg-[#0F151C] border border-[#1E293B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-[#0F151C] border border-[#1E293B] rounded-2xl p-12 text-center text-slate-400">
            <AlertTriangle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <h3 className="text-base font-semibold text-white">No vulnerabilities found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedSeverity !== 'All'
                ? `No ${selectedSeverity} severity issues found with your current filters.`
                : 'All targets currently assessed have zero active issues matching your search query.'}
            </p>
          </div>
        ) : (
          filteredFindings.map((finding, idx) => (
            <div
              key={finding.id || idx}
              onClick={() => onSelectFinding(finding)}
              className="bg-[#0F151C] border border-[#1E293B] hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {finding.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1 truncate">
                      <Globe className="w-3 h-3 text-red-400 shrink-0" />
                      {finding.urlTested}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-red-300 transition-colors">
                    {finding.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {finding.description}
                  </p>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0">
                  <span className="text-xs font-semibold text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View Details <ChevronRight className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] text-slate-500">Status: {finding.status || 'Open'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
