import React from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import { EvalMetrics, EvalMatchDetail } from '../types/specDelta';
import { GroundTruthItem } from '../data/demoData';

interface EvalModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: EvalMetrics | null;
  matchDetails: EvalMatchDetail[];
  onRunEval: () => void;
  isLoading: boolean;
  groundTruth?: GroundTruthItem[];
  ipName?: string;
}

export const EvalModal: React.FC<EvalModalProps> = ({
  isOpen,
  onClose,
  metrics,
  matchDetails,
  onRunEval,
  isLoading,
  groundTruth = [],
  ipName = 'AXI_UART_DMA_IP',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  Ground Truth Verification Benchmark
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  INJECT & TEST MODE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Automated evaluation against the {groundTruth.length} known planted specification mutations in {ipName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Evaluation Protocol
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluates semantic diff & impact detection models for precision, recall, and zero-hallucination discipline.
              </p>
            </div>
            <button
              onClick={onRunEval}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Benchmark...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Benchmark Evaluation</span>
                </>
              )}
            </button>
          </div>

          {/* Metrics Grid */}
          {metrics ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Detected N of 8 */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">Detected Changes</span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-2xl font-bold text-emerald-400 font-mono">
                      {metrics.truePositives}
                    </span>
                    <span className="text-sm text-zinc-500 font-mono">
                      / {metrics.groundTruthCount}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(metrics.truePositives / metrics.groundTruthCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    Recall: {(metrics.recall * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* False Positives */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">False Positives</span>
                  <div className="mt-1">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        metrics.falsePositives === 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {metrics.falsePositives}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 mt-3 font-mono">
                  {metrics.falsePositives === 0
                    ? 'Zero hallucinated changes'
                    : 'Unplanted changes detected'}
                </p>
              </div>

              {/* Precision */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">Precision</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-cyan-400 font-mono">
                      {(metrics.precision * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metrics.precision * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    TP / (TP + FP)
                  </span>
                </div>
              </div>

              {/* F1 Score */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">F1 Score</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold text-purple-400 font-mono">
                      {(metrics.f1Score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metrics.f1Score * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block font-mono">
                    Harmonic mean
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
              Click <strong>"Run Benchmark Evaluation"</strong> to test current pipeline output against the 8 ground-truth planted changes.
            </div>
          )}

          {/* Planted Changes Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Planted Ground Truth Changes ({groundTruth.length} Items)
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {ipName} Verification Matrix
              </span>
            </div>

            <div className="divide-y divide-zinc-800/80 font-mono text-xs">
              {groundTruth.map((gt, idx) => {
                const matchInfo = matchDetails.find((m) => m.gt_id === gt.id);
                const isMatched = matchInfo ? matchInfo.matched : false;

                return (
                  <div
                    key={gt.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {matchInfo ? (
                          isMatched ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-zinc-700 inline-block" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-200 font-sans">
                            {idx + 1}. {gt.title}
                          </span>
                          <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {gt.change_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                          {gt.description}
                        </p>
                        <div className="text-[10px] text-zinc-500 mt-1">
                          Clause: <span className="text-zinc-400">{gt.clause}</span> • Targets: {gt.expected_stale_files.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0 text-right">
                      {matchInfo ? (
                        isMatched ? (
                          <div className="text-right">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                              Detected ({matchInfo.matched_change_id})
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-1 max-w-xs truncate">
                              {matchInfo.matched_summary}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold uppercase">
                            Missed
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-zinc-600">Pending Eval</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-xs text-zinc-500 font-mono">
            Ground Truth: {ipName}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
