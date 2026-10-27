import React, { useState } from 'react';
import {
  FileDown,
  Download,
  Filter,
  Search,
  AlertTriangle,
  ShieldAlert,
  FileCode,
  Copy,
  Check,
  CheckCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { StaleReport, StaleReportItem, ArtifactMapping, SpecChange } from '../types/specDelta';
import { exportReportToMarkdown, exportReportToCSV, downloadFile } from '../utils/exportUtils';

import { ListTodo } from 'lucide-react';

interface TabReportProps {
  report: StaleReport | null;
  onOpenEvidence: (mapping: ArtifactMapping, change?: SpecChange) => void;
  onOpenExport?: () => void;
  onOpenActionPlan?: () => void;
}

export const TabReport: React.FC<TabReportProps> = ({
  report,
  onOpenEvidence,
  onOpenExport,
  onOpenActionPlan,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!report) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-xs">
        No report generated yet. Run the analysis pipeline to generate a ranked stale impact report.
      </div>
    );
  }

  const handleExportMarkdown = () => {
    const md = exportReportToMarkdown(report);
    downloadFile(md, `specdelta-report-${Date.now()}.md`, 'text/markdown');
  };

  const handleExportCSV = () => {
    const csv = exportReportToCSV(report);
    downloadFile(csv, `specdelta-report-${Date.now()}.csv`, 'text/csv');
  };

  const handleCopyFix = (fix: string, idx: number) => {
    navigator.clipboard.writeText(fix);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredItems = report.ranked_stale_list.filter((item) => {
    const matchesSearch =
      item.file.toLowerCase().includes(search.toLowerCase()) ||
      item.change_summary.toLowerCase().includes(search.toLowerCase()) ||
      item.why_stale.toLowerCase().includes(search.toLowerCase()) ||
      item.change_id.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'all' || item.severity.toLowerCase() === selectedSeverity.toLowerCase();

    const matchesType =
      selectedType === 'all' || item.artifact_type.toLowerCase() === selectedType.toLowerCase();

    const matchesConf = item.confidence >= minConfidence;

    return matchesSearch && matchesSeverity && matchesType && matchesConf;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Export Controls */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <span>Ranked Stale Backlog & Audit Report</span>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono">
              {report.total_stale_findings} Stale Findings
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Strictly ranked by architectural severity (Critical &gt; Major &gt; Minor) then confidence (1.0 &rarr; 0.0)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch md:self-auto">
          {onOpenActionPlan && (
            <button
              onClick={onOpenActionPlan}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900/80 text-red-200 border border-red-700/80 transition-colors shadow-md cursor-pointer"
            >
              <ListTodo className="w-4 h-4 text-red-400" />
              <span>Action Plan (Top 5)...</span>
            </button>
          )}

          {onOpenExport ? (
            <button
              onClick={onOpenExport}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Report (CSV / Markdown)...</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleExportMarkdown}
                className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-cyan-400" />
                <span>Export Markdown</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Impact Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Critical Stale Defects</span>
          <p className="text-xl font-bold text-red-400 font-mono mt-1">
            {report.critical_count}
          </p>
          <span className="text-[10px] text-zinc-500">Requires immediate RTL/TB fix</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Major Stale Items</span>
          <p className="text-xl font-bold text-amber-400 font-mono mt-1">
            {report.major_count}
          </p>
          <span className="text-[10px] text-zinc-500">Reg header & testplan sync</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Minor Stale Adjustments</span>
          <p className="text-xl font-bold text-blue-400 font-mono mt-1">
            {report.minor_count}
          </p>
          <span className="text-[10px] text-zinc-500">Auxiliary / non-blocking</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-zinc-400">Verification Gaps</span>
          <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {report.total_gaps}
          </p>
          <span className="text-[10px] text-zinc-500">Missing assertions / bins</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search report..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-zinc-500 font-medium">Severity:</span>
            {['all', 'critical', 'major', 'minor'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize cursor-pointer transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Artifact Type */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-zinc-500 font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none font-mono"
            >
              <option value="all">All Types</option>
              <option value="RTL">RTL</option>
              <option value="Registers">Registers</option>
              <option value="UVM/TB">UVM/TB</option>
              <option value="Assertions">Assertions</option>
              <option value="Coverage">Coverage</option>
              <option value="Testplan">Testplan</option>
            </select>
          </div>

          {/* Min Conf */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-zinc-500 font-medium whitespace-nowrap">
              Min Conf: <span className="font-mono text-zinc-300">{(minConfidence * 100).toFixed(0)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Ranked Stale List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-xs">
            No stale findings match the filter criteria.
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const confPct = Math.round(item.confidence * 100);
            const confColor =
              confPct >= 80
                ? 'text-emerald-400 bg-emerald-950/80 border-emerald-700/80'
                : confPct >= 60
                ? 'text-amber-400 bg-amber-950/80 border-amber-700/80'
                : 'text-yellow-400 bg-yellow-950/80 border-yellow-700/80';

            const severityBorder =
              item.severity === 'critical'
                ? 'border-l-4 border-l-red-500'
                : item.severity === 'major'
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-blue-500';

            return (
              <div
                key={`${item.change_id}_${item.file}_${item.line_range}_${idx}`}
                className={`bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all shadow-md ${severityBorder}`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                      {item.change_id}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        item.severity === 'critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : item.severity === 'major'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200">
                      {item.change_summary}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-mono font-semibold ${confColor}`}
                    >
                      {confPct}% Conf
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {item.artifact_type}
                    </span>
                    <button
                      onClick={() => onOpenEvidence(item)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 cursor-pointer"
                      title="Inspect full evidence"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left: Location & Why Stale */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-zinc-400 flex items-center space-x-1.5">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-zinc-200 font-semibold">{item.file}</span>
                      <span className="text-zinc-600">:</span>
                      <span className="text-amber-400">Lines {item.line_range}</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        Why Stale:
                      </span>
                      {item.why_stale}
                    </div>
                  </div>

                  {/* Right: Quoted Evidence Snippet */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">
                      Quoted Evidence from File:
                    </span>
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-rose-300 overflow-x-auto max-h-24">
                      <pre className="whitespace-pre-wrap">{item.evidence_snippet}</pre>
                    </div>
                  </div>
                </div>

                {/* Suggested Fix (Non-destructive recommendation) */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono shrink-0">
                      Suggested Fix:
                    </span>
                    <span className="font-mono text-xs text-emerald-300 truncate">
                      {item.suggested_fix}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyFix(item.suggested_fix, idx)}
                    className="self-end sm:self-auto text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
