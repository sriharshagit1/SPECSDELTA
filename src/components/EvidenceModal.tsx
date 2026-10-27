import React, { useState } from 'react';
import { X, Copy, Check, AlertTriangle, ShieldCheck, FileCode, ArrowRight } from 'lucide-react';
import { ArtifactMapping, SpecChange } from '../types/specDelta';

interface EvidenceModalProps {
  mapping: ArtifactMapping | null;
  change?: SpecChange | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  mapping,
  change,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!mapping) return null;

  const handleCopyFix = () => {
    navigator.clipboard.writeText(mapping.suggested_fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidencePct = Math.round(mapping.confidence * 100);
  const confidenceColor =
    confidencePct >= 80
      ? 'text-emerald-400 bg-emerald-950/80 border-emerald-700/80'
      : confidencePct >= 60
      ? 'text-amber-400 bg-amber-950/80 border-amber-700/80'
      : 'text-yellow-400 bg-yellow-950/80 border-yellow-700/80';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-white font-mono">
                  {mapping.change_id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {mapping.artifact_type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-mono font-semibold ${confidenceColor}`}
                >
                  {confidencePct}% Confidence
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                {mapping.file} <span className="text-zinc-600">•</span> Lines {mapping.line_range}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Change Context */}
          {change && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-400 font-mono uppercase">
                  Spec Delta Context: {change.spec_clause}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    change.severity === 'critical'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : change.severity === 'major'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}
                >
                  {change.severity}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-200">{change.summary}</p>
              <div className="mt-2 text-xs flex items-center space-x-2 font-mono text-zinc-400">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-rose-300">
                  Old: {change.old_value}
                </span>
                <ArrowRight className="w-3 h-3 text-zinc-600" />
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-300">
                  New: {change.new_value}
                </span>
              </div>
            </div>
          )}

          {/* Why Stale */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Why This Artifact is Stale</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-200 text-xs leading-relaxed">
              {mapping.why_stale}
            </div>
          </div>

          {/* Quoted Evidence Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Quoted Evidence from File</span>
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                {mapping.file} : {mapping.line_range}
              </span>
            </div>
            <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3.5 font-mono text-xs text-rose-300 leading-relaxed overflow-x-auto shadow-inner">
              <pre className="whitespace-pre-wrap">{mapping.evidence_snippet}</pre>
            </div>
          </div>

          {/* Suggested Fix (Suggestions only, never auto-modify) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Suggested Remediation (Manual Review Required)</span>
              </h4>
              <button
                onClick={handleCopyFix}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Fix</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-3.5 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
              <pre className="whitespace-pre-wrap">{mapping.suggested_fix}</pre>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 italic">
              Notice: Per verification safety protocols, fixes are suggestions only and must be inspected before commit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
