import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Copy,
  Check,
  Filter,
  ShieldCheck,
  Eye,
  Sliders,
  CheckCircle2,
  FileCode,
  FileCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StaleReport } from '../types/specDelta';
import {
  exportReportToCSV,
  exportReportToMarkdown,
  downloadFile,
  filterReportItems,
  ExportOptions,
} from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StaleReport | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'markdown'>('csv');
  const [minSeverity, setMinSeverity] = useState<'all' | 'critical' | 'major'>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [includeGaps, setIncludeGaps] = useState<boolean>(true);
  const [includeSnippets, setIncludeSnippets] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);

  // Default filename based on date
  const todayStr = new Date().toISOString().split('T')[0];
  const [customFilename, setCustomFilename] = useState<string>(`specdelta-stale-report-${todayStr}`);

  // Calculate filtered stats
  const filteredItems = useMemo(() => {
    if (!report) return [];
    return filterReportItems(report.ranked_stale_list, minSeverity, minConfidence);
  }, [report, minSeverity, minConfidence]);

  // Generate exported string
  const exportedContent = useMemo(() => {
    if (!report) return '';
    const options: ExportOptions = {
      format: selectedFormat,
      minSeverity,
      minConfidence,
      includeGaps,
      includeCodeSnippets: includeSnippets,
    };

    if (selectedFormat === 'csv') {
      return exportReportToCSV(report, options);
    } else {
      return exportReportToMarkdown(report, options);
    }
  }, [report, selectedFormat, minSeverity, minConfidence, includeGaps, includeSnippets]);

  if (!isOpen) return null;

  const currentExt = selectedFormat === 'csv' ? 'csv' : 'md';
  const currentMimeType = selectedFormat === 'csv' ? 'text/csv' : 'text/markdown';
  const fullFilename = customFilename.endsWith(`.${currentExt}`)
    ? customFilename
    : `${customFilename}.${currentExt}`;

  const handleDownload = () => {
    downloadFile(exportedContent, fullFilename, currentMimeType);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const includedFields = [
    { name: 'Rank & Priority Index', desc: 'Sequential index sorted by severity then confidence' },
    { name: 'Change ID & Clause', desc: 'Hardware spec reference (e.g., CHG-1, Section 3.2)' },
    { name: 'Severity Level', desc: 'Critical, Major, or Minor architectural impact rating' },
    { name: 'Confidence Score', desc: 'Statistical confidence percentage (e.g., 98%)' },
    { name: 'Artifact Type & File', desc: 'RTL, Registers, UVM/TB, Assertions, Coverage, Testplan' },
    { name: 'Source Line Range', desc: 'Target lines where stale logic exists (e.g., 28-29)' },
    { name: 'Why Stale Root Cause', desc: 'Engineering rationale detailing why artifact is obsolete' },
    { name: 'Quoted Code Evidence', desc: 'Exact verbatim quoted code snippet from artifact file' },
    { name: 'Suggested Remediation', desc: 'Non-destructive suggested patch or fix' },
    ...(includeGaps ? [{ name: 'Verification Gaps Table', desc: 'Spec features missing assertions, coverage, or tests' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700/90 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Export Stale Impact Report
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {filteredItems.length} findings
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Configure report structure, filter severity, and download in CSV or Markdown format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Format Selector Cards */}
          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-2 font-mono">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CSV Card */}
              <div
                onClick={() => setSelectedFormat('csv')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedFormat === 'csv'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                        <span>CSV Spreadsheet</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400">
                          .csv
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Delimited tabular format for Excel, Google Sheets, or Jira bug trackers
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      selectedFormat === 'csv'
                        ? 'border-emerald-500 bg-emerald-500 text-zinc-950'
                        : 'border-zinc-600'
                    }`}
                  >
                    {selectedFormat === 'csv' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                  <span>Structured Columns: 12 fields</span>
                  <span className="text-emerald-400">Excel / Jira Ready</span>
                </div>
              </div>

              {/* Markdown Card */}
              <div
                onClick={() => setSelectedFormat('markdown')}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedFormat === 'markdown'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedFormat === 'markdown'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                        <span>Markdown Technical Report</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400">
                          .md
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Rich document with summary KPIs, code fences, and verification roadmap
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                      selectedFormat === 'markdown'
                        ? 'border-cyan-500 bg-cyan-500 text-zinc-950'
                        : 'border-zinc-600'
                    }`}
                  >
                    {selectedFormat === 'markdown' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                  <span>Includes Code Blocks & Tables</span>
                  <span className="text-cyan-400">PR / Review Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration and Filters */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. Filter Report Scope</span>
              </label>
              <span className="text-xs text-zinc-500 font-mono">
                Will export: <strong className="text-zinc-200">{filteredItems.length}</strong> of{' '}
                {report?.total_stale_findings || 0} items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Severity Scope */}
              <div>
                <label className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                  Severity Threshold:
                </label>
                <div className="flex space-x-1.5">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'major', label: 'Critical & Major' },
                    { id: 'critical', label: 'Critical Only' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setMinSeverity(opt.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        minSeverity === opt.id
                          ? 'bg-zinc-800 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-zinc-400 font-medium">
                    Minimum Confidence:
                  </label>
                  <span className="text-xs font-mono text-zinc-200">
                    {(minConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGaps}
                  onChange={(e) => setIncludeGaps(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                />
                <span>Include Verification Gaps section ({report?.total_gaps || 0} gaps)</span>
              </label>

              {selectedFormat === 'markdown' && (
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSnippets}
                    onChange={(e) => setIncludeSnippets(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                  />
                  <span>Include Quoted Code Evidence Snippets</span>
                </label>
              )}
            </div>
          </div>

          {/* Included Fields Specification */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Report Field Structure Guarantee
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {includedFields.map((f, i) => (
                <div key={i} className="flex items-start space-x-2 p-1.5 rounded bg-zinc-900/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200 font-mono text-[11px]">
                      {f.name}
                    </span>
                    <p className="text-[10px] text-zinc-500 leading-tight">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filename Customization */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 font-mono">
              3. Target File Name
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="specdelta-stale-report"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-cyan-300">
                .{currentExt}
              </span>
            </div>
          </div>

          {/* File Content Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wider flex items-center space-x-1 font-mono cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showPreview ? 'Hide File Preview' : 'Show File Preview'}</span>
              </button>
              <button
                onClick={handleCopy}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Raw Content</span>
                  </>
                )}
              </button>
            </div>

            {showPreview && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 max-h-48 overflow-y-auto overflow-x-auto shadow-inner leading-relaxed">
                <pre className="whitespace-pre">{exportedContent}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
            <span>Ready: {fullFilename}</span>
            <span>•</span>
            <span>{(new Blob([exportedContent]).size / 1024).toFixed(1)} KB</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                selectedFormat === 'csv'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/60'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download {selectedFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
