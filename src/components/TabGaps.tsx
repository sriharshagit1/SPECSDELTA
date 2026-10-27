import React from 'react';
import { AlertOctagon, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, FileQuestion } from 'lucide-react';
import { VerificationGap } from '../types/specDelta';

interface TabGapsProps {
  gaps: VerificationGap[];
}

export const TabGaps: React.FC<TabGapsProps> = ({ gaps }) => {
  const missingBadgeColors: Record<string, string> = {
    Assertions: 'bg-amber-950 text-amber-300 border-amber-800',
    Coverage: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    Testplan: 'bg-rose-950 text-rose-300 border-rose-800',
    RTL: 'bg-purple-950 text-purple-300 border-purple-800',
    'UVM/TB': 'bg-cyan-950 text-cyan-300 border-cyan-800',
    Registers: 'bg-blue-950 text-blue-300 border-blue-800',
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 shrink-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-200">
            Design Verification & Testbench Blind Spot Detector
          </h3>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            A <strong>Verification Gap</strong> occurs when a hardware spec revision introduces a new operational mode, interrupt, or protocol feature that is completely unreferenced by your testbench, functional coverage model, or SVA assertion suite. In semiconductor tape-outs, unverified gaps present severe post-silicon escape risks.
          </p>
        </div>
      </div>

      {/* Gaps List */}
      {gaps.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Verification Gaps Detected</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            All identified spec changes have matching downstream verification artifacts, assertions, or test plan entries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Uncovered Spec Delta Items ({gaps.length})
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Action Required Before Tape-Out
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {gaps.map((gap) => {
              return (
                <div
                  key={gap.change_id}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-colors shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80">
                        {gap.change_id}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-100">
                        {gap.change_summary}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                      <span className="text-[11px] text-zinc-500 mr-1 font-mono">
                        Missing:
                      </span>
                      {gap.missing_artifacts.map((artType) => (
                        <span
                          key={artType}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                            missingBadgeColors[artType] || 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {artType}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation block */}
                  <div className="mt-3.5 bg-zinc-950 rounded-lg p-3.5 border border-zinc-800/80">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 mb-1.5 font-mono uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>DV Team Remediation Recommendation</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                      {gap.recommendation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
