import React from 'react';
import {
  X,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  HardDrive,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { ALL_IP_PRESETS, IPPreset } from '../data/ipPresets';

interface PresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresetId: string;
  onSelectPreset: (preset: IPPreset) => void;
}

export const PresetSelectorModal: React.FC<PresetSelectorModalProps> = ({
  isOpen,
  onClose,
  currentPresetId,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  const presetIcons: Record<string, React.ReactNode> = {
    uart_dma: <Cpu className="w-5 h-5 text-cyan-400" />,
    pcie_gen5: <Zap className="w-5 h-5 text-amber-400" />,
    octal_spi: <HardDrive className="w-5 h-5 text-emerald-400" />,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">
                  Select Hardware Specification & IP Core
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {ALL_IP_PRESETS.length} Verification Presets
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Switch between different semiconductor subsystems to test and verify spec-change staleness detection
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

        {/* Preset Cards List */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Each IP preset includes complete Spec v1 and Spec v2 hardware engineering clauses, downstream RTL (`.sv`), Register headers (`.h`), SVA Assertions (`.sv`), UVM Testbenches, Functional Coverage, and Test Plans with ground truth verification benchmarks.
          </p>

          <div className="space-y-3">
            {ALL_IP_PRESETS.map((preset) => {
              const isSelected = preset.id === currentPresetId;
              const icon = presetIcons[preset.id] || <Cpu className="w-5 h-5 text-cyan-400" />;

              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                      {icon}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-zinc-100 font-mono">
                          {preset.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {preset.revisions}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                          • {preset.category}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 mt-1">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-zinc-400 font-mono">
                        <span className="flex items-center space-x-1">
                          <FileCode className="w-3 h-3 text-cyan-400" />
                          <span>{preset.artifacts.length} downstream files</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>8 planted changes</span>
                        </span>
                        <span>•</span>
                        <span className="text-zinc-500">
                          {preset.groundTruth.map((gt) => gt.change_type).slice(0, 4).join(', ')}...
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-semibold flex items-center space-x-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Active IP</span>
                      </span>
                    ) : (
                      <button className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center space-x-1 font-mono cursor-pointer">
                        <span>Load IP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>You can also upload custom specs in the "Specs & Files" panel.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
