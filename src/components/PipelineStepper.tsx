import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle, Clock, GitCompare, FileSearch, Sparkles, FileText } from 'lucide-react';
import { PipelineProgress } from '../types/specDelta';

interface PipelineStepperProps {
  progress: PipelineProgress;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ progress }) => {
  const stages = [
    {
      num: 1,
      title: 'Stage 1: Semantic Diff',
      desc: 'Ignore cosmetic edits; extract functional deltas',
      icon: GitCompare,
      status: progress.stageStatuses[1],
    },
    {
      num: 2,
      title: 'Stage 2: Artifact Mapping',
      desc: 'Pinpoint stale lines & quote quoted code snippets',
      icon: FileSearch,
      status: progress.stageStatuses[2],
    },
    {
      num: 3,
      title: 'Stage 3: Gap Detection',
      desc: 'Find missing assertions, coverage & testplans',
      icon: Sparkles,
      status: progress.stageStatuses[3],
    },
    {
      num: 4,
      title: 'Stage 4: Stale Report',
      desc: 'Severity & confidence ranked stale backlog',
      icon: FileText,
      status: progress.stageStatuses[4],
    },
  ];

  return (
    <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stages.map((st) => {
            const Icon = st.icon;
            const isCompleted = st.status === 'completed';
            const isRunning = st.status === 'running';
            const isError = st.status === 'error';
            const isPending = st.status === 'pending';

            return (
              <div
                key={st.num}
                className={`relative flex items-center p-2.5 rounded-lg border transition-all ${
                  isRunning
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-sm shadow-cyan-500/10'
                    : isCompleted
                    ? 'bg-zinc-900/90 border-emerald-900/60'
                    : isError
                    ? 'bg-red-950/40 border-red-800/80'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 ${
                    isRunning
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isError
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {st.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        isRunning
                          ? 'bg-cyan-900 text-cyan-300 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-950 text-emerald-400'
                          : isError
                          ? 'bg-red-950 text-red-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {progress.error && (
          <div className="mt-2.5 p-2.5 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{progress.error}</span>
            </div>
            <span className="text-[10px] text-red-400 font-mono">Pipeline Halted</span>
          </div>
        )}
      </div>
    </div>
  );
};
