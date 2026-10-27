import React from 'react';
import { Cpu, Play, Database, ShieldCheck, Sliders, CheckCircle2, AlertTriangle, RefreshCw, Download, ListTodo } from 'lucide-react';
import { PipelineProgress } from '../types/specDelta';

interface NavbarProps {
  onLoadDemo: () => void;
  onOpenPresets?: () => void;
  currentIpName?: string;
  onRunPipeline: () => void;
  onOpenEval: () => void;
  onOpenExport?: () => void;
  onOpenActionPlan?: () => void;
  onToggleInputs: () => void;
  isInputsOpen: boolean;
  progress: PipelineProgress;
  hasArtifacts: boolean;
  artifactsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadDemo,
  onOpenPresets,
  currentIpName = 'AXI_UART_DMA_IP',
  onRunPipeline,
  onOpenEval,
  onOpenExport,
  onOpenActionPlan,
  onToggleInputs,
  isInputsOpen,
  progress,
  hasArtifacts,
  artifactsCount,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Cpu className="w-5 h-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                Spec<span className="text-cyan-400">Delta</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono">
                v2.4 EDA
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Semiconductor Spec-Change Impact & Staleness Analyzer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Select Hardware IP Spec Preset */}
          {onOpenPresets ? (
            <button
              onClick={onOpenPresets}
              title="Select or switch hardware IP specification (UART/DMA, PCIe Gen5, Octal SPI)"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-cyan-800/80 transition-colors cursor-pointer shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono truncate max-w-[140px] sm:max-w-none">{currentIpName}</span>
              <span className="text-[10px] bg-zinc-800 px-1 rounded text-zinc-400">Switch</span>
            </button>
          ) : (
            <button
              onClick={onLoadDemo}
              title="Load UART/DMA peripheral sample with 8 planted changes"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load Demo Data</span>
            </button>
          )}

          {/* Toggle Inputs / Files Drawer */}
          <button
            onClick={onToggleInputs}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isInputsOpen
                ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700/80 text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span>Specs & Files ({artifactsCount})</span>
          </button>

          {/* Evaluation Mode ("Inject & Test") */}
          <button
            onClick={onOpenEval}
            title="Evaluate precision & recall against 8 planted ground-truth changes"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 transition-colors shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inject & Test</span>
          </button>

          {/* Action Plan Modal Trigger (Top 5 Critical Stale) */}
          {onOpenActionPlan && (
            <button
              onClick={onOpenActionPlan}
              title="Consolidated Action Plan & Refactoring Steps for Top 5 Critical Stale Items"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/70 hover:bg-red-900/70 text-red-300 border border-red-700/80 transition-colors shadow-sm cursor-pointer"
            >
              <ListTodo className="w-3.5 h-3.5 text-red-400" />
              <span>Action Plan</span>
            </button>
          )}

          {/* Export Report Modal Trigger */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              title="Export Stale Impact Report as CSV or Markdown"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export...</span>
            </button>
          )}

          {/* Run Pipeline Button */}
          <button
            onClick={onRunPipeline}
            disabled={progress.isProcessing || !hasArtifacts}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer ${
              progress.isProcessing
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : !hasArtifacts
                ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 active:scale-95'
            }`}
          >
            {progress.isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>Analyzing Delta...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
