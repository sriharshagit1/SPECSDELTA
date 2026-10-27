import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCode,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Terminal,
  Cpu,
  Sparkles,
  GitPullRequest,
  CheckSquare,
  Square,
  Layers,
  FileCheck,
} from 'lucide-react';
import { StaleReport } from '../types/specDelta';
import {
  generateTop5ActionPlan,
  ActionPlanStep,
  exportActionPlanToMarkdown,
} from '../utils/actionPlanUtils';
import { downloadFile } from '../utils/exportUtils';

interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StaleReport | null;
  ipName?: string;
}

export const ActionPlanModal: React.FC<ActionPlanModalProps> = ({
  isOpen,
  onClose,
  report,
  ipName = 'Hardware IP',
}) => {
  // Base plan items generated from report
  const initialPlan = useMemo(() => generateTop5ActionPlan(report), [report]);

  // Keep track of resolved/in_progress state per rank
  const [itemStatuses, setItemStatuses] = useState<Record<number, 'pending' | 'in_progress' | 'resolved'>>({});
  const [copiedPatchIdx, setCopiedPatchIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  if (!isOpen) return null;

  const getStatus = (rank: number) => itemStatuses[rank] || 'pending';

  const toggleStatus = (rank: number, status: 'pending' | 'in_progress' | 'resolved') => {
    setItemStatuses((prev) => ({ ...prev, [rank]: status }));
  };

  const resolvedCount = initialPlan.filter((p) => getStatus(p.rank) === 'resolved').length;
  const inProgressCount = initialPlan.filter((p) => getStatus(p.rank) === 'in_progress').length;

  const handleCopyFix = (fix: string, idx: number) => {
    navigator.clipboard.writeText(fix);
    setCopiedPatchIdx(idx);
    setTimeout(() => setCopiedPatchIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const md = exportActionPlanToMarkdown(initialPlan, ipName);
    navigator.clipboard.writeText(md);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = exportActionPlanToMarkdown(initialPlan, ipName);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(md, `action-plan-${ipName.toLowerCase()}-${dateStr}.md`, 'text/markdown');
  };

  const activeItem = initialPlan.find((p) => p.rank === activeStepTab) || initialPlan[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-950 border border-red-800 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Consolidated Action Plan (Top 5 Critical Stale Artifacts)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold uppercase">
                  Tape-out Blocker
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Specific code refactoring instructions & UVM verification updates for <span className="text-cyan-400 font-mono">{ipName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy Plan</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export .md</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress KPI Bar */}
        <div className="px-6 py-3 bg-zinc-950/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <span className="font-mono text-zinc-400">
              Remediation Progress: <strong className="text-white">{resolvedCount}</strong> / {initialPlan.length} Resolved
            </span>
            <div className="w-36 bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(resolvedCount / (initialPlan.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{resolvedCount} Resolved</span>
            </span>
            <span className="text-amber-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>{inProgressCount} In Progress</span>
            </span>
            <span className="text-zinc-400 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
              <span>{initialPlan.length - resolvedCount - inProgressCount} Pending</span>
            </span>
          </div>
        </div>

        {/* Main Content: Left Nav for Top 5 + Right Details */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Top 5 Selector Cards */}
          <div className="w-full md:w-80 bg-zinc-950/80 border-r border-zinc-800 p-3 overflow-y-auto space-y-2 shrink-0">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono px-1 pb-1">
              Top 5 Priority Backlog
            </div>

            {initialPlan.map((step) => {
              const isSelected = activeStepTab === step.rank;
              const status = getStatus(step.rank);

              return (
                <div
                  key={step.rank}
                  onClick={() => setActiveStepTab(step.rank)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-800/90 border-cyan-500 shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px] font-bold flex items-center justify-center">
                        #{step.rank}
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {step.changeId}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                        status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : status === 'in_progress'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-200 line-clamp-1">
                    {step.changeSummary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-2 pt-2 border-t border-zinc-800/60">
                    <span className="truncate max-w-[140px]">{step.file.split('/').pop()}</span>
                    <span className="text-cyan-400">{step.artifactType}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Action Plan & Dual Engineering Tracks */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeItem ? (
              <>
                {/* Active Item Header & Status Toggle */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-md bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center">
                        #{activeItem.rank}
                      </span>
                      <span className="font-mono text-sm font-bold text-cyan-400">
                        {activeItem.changeId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-bold">
                        {activeItem.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {activeItem.artifactType}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-100 mt-1">
                      {activeItem.changeSummary}
                    </h4>

                    <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center space-x-2">
                      <span>Target: <strong className="text-zinc-200">{activeItem.file}</strong></span>
                      <span>•</span>
                      <span className="text-amber-400">Lines {activeItem.lineRange}</span>
                      <span>•</span>
                      <span>Clause: {activeItem.specClause}</span>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-zinc-900 p-1 rounded-lg border border-zinc-800 font-mono text-xs">
                    {(['pending', 'in_progress', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => toggleStatus(activeItem.rank, st)}
                        className={`px-2.5 py-1 rounded capitalize transition-colors cursor-pointer ${
                          getStatus(activeItem.rank) === st
                            ? st === 'resolved'
                              ? 'bg-emerald-600 text-white font-bold'
                              : st === 'in_progress'
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-zinc-800 text-white font-bold'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Why Stale Root Cause */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-400 font-mono uppercase block mb-1">
                    Staleness Root Cause:
                  </span>
                  {activeItem.whyStale}
                </div>

                {/* Dual Track Technical Remediation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Track 1: RTL Code Refactoring */}
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 flex flex-col">
                    <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-3">
                      <Terminal className="w-4 h-4" />
                      <span>RTL & Subsystem Refactoring Steps</span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {activeItem.refactoringSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-xs text-zinc-300">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Track 2: UVM Testbench Updates */}
                  <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 flex flex-col">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-3">
                      <GitPullRequest className="w-4 h-4" />
                      <span>UVM Test & Assertion Updates</span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {activeItem.uvmTestUpdates.map((step, idx) => (
                        <div key={idx} className="flex items-start space-x-2.5 text-xs text-zinc-300">
                          <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Code Patch */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Remediation Code Patch Preview
                    </span>
                    <button
                      onClick={() => handleCopyFix(activeItem.suggestedFix, activeItem.rank)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono cursor-pointer"
                    >
                      {copiedPatchIdx === activeItem.rank ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied Patch</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Suggested Fix</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-rose-900/40">
                      <span className="text-[10px] font-mono font-bold text-rose-400 uppercase block mb-1.5">
                        Before: Stale Quoted Code ({activeItem.file}:{activeItem.lineRange})
                      </span>
                      <div className="font-mono text-xs text-rose-300 overflow-x-auto max-h-36">
                        <pre className="whitespace-pre-wrap">{activeItem.evidenceSnippet}</pre>
                      </div>
                    </div>

                    {/* After */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-emerald-900/40">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block mb-1.5">
                        After: Suggested Non-Destructive Refactoring
                      </span>
                      <div className="font-mono text-xs text-emerald-300 overflow-x-auto max-h-36">
                        <pre className="whitespace-pre-wrap">{activeItem.suggestedFix}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No critical stale items identified.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-mono">
            Targeting 100% resolution before RTL tape-out milestone
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close Action Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
