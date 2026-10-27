import React, { useState } from 'react';
import {
  GitCompare,
  Search,
  Filter,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SpecChange, Severity, ChangeType } from '../types/specDelta';

interface TabChangesProps {
  changes: SpecChange[];
  onSelectChange?: (changeId: string) => void;
}

export const TabChanges: React.FC<TabChangesProps> = ({ changes, onSelectChange }) => {
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const changeTypeBadge: Record<string, { bg: string; text: string; border: string }> = {
    width: { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-800' },
    reset_value: { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-800' },
    new_feature: { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-800' },
    removed: { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-800' },
    timing: { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-800' },
    polarity: { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-800' },
    rename: { bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-800' },
    behavior: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
  };

  const filteredChanges = changes.filter((c) => {
    const matchesSearch =
      c.summary.toLowerCase().includes(search.toLowerCase()) ||
      c.spec_clause.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.old_value.toLowerCase().includes(search.toLowerCase()) ||
      c.new_value.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'all' || c.severity.toLowerCase() === selectedSeverity.toLowerCase();

    const matchesType =
      selectedType === 'all' || c.change_type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesSeverity && matchesType;
  });

  const criticalCount = changes.filter((c) => c.severity.toLowerCase() === 'critical').length;
  const majorCount = changes.filter((c) => c.severity.toLowerCase() === 'major').length;
  const minorCount = changes.filter((c) => c.severity.toLowerCase() === 'minor').length;

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Total Spec Changes</p>
            <p className="text-xl font-bold text-white font-mono">{changes.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
            <GitCompare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Critical Severity</p>
            <p className="text-xl font-bold text-red-400 font-mono">{criticalCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Major Severity</p>
            <p className="text-xl font-bold text-amber-400 font-mono">{majorCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Minor Severity</p>
            <p className="text-xl font-bold text-blue-400 font-mono">{minorCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search clause, signal, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[11px] text-zinc-500 font-medium mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" />
            Severity:
          </span>
          {['all', 'critical', 'major', 'minor'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                selectedSeverity === sev
                  ? sev === 'critical'
                    ? 'bg-red-950 text-red-300 border border-red-700'
                    : sev === 'major'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : sev === 'minor'
                    ? 'bg-blue-950 text-blue-300 border border-blue-700'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Change Type Filters */}
        <div className="flex items-center space-x-1.5 w-full md:w-auto">
          <span className="text-[11px] text-zinc-500 font-medium mr-1">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Types</option>
            <option value="width">Width</option>
            <option value="reset_value">Reset Value</option>
            <option value="new_feature">New Feature</option>
            <option value="removed">Removed</option>
            <option value="timing">Timing</option>
            <option value="polarity">Polarity</option>
            <option value="rename">Rename</option>
            <option value="behavior">Behavior</option>
          </select>
        </div>
      </div>

      {/* Changes List */}
      {filteredChanges.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-xs">
          No specification changes match the selected filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChanges.map((change) => {
            const isExpanded = expandedId === change.id;
            const typeStyle = changeTypeBadge[change.change_type] || {
              bg: 'bg-zinc-800',
              text: 'text-zinc-300',
              border: 'border-zinc-700',
            };

            const severityBorder =
              change.severity === 'critical'
                ? 'border-l-4 border-l-red-500'
                : change.severity === 'major'
                ? 'border-l-4 border-l-amber-500'
                : 'border-l-4 border-l-blue-500';

            return (
              <div
                key={change.id}
                className={`bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-hidden transition-all hover:border-zinc-700 ${severityBorder}`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : change.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/60">
                      {change.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                    >
                      {change.change_type}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200 font-mono">
                      {change.spec_clause}
                    </span>
                    <span className="text-sm font-medium text-zinc-300">
                      {change.summary}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
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

                    {onSelectChange && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectChange(change.id);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors font-medium cursor-pointer"
                      >
                        View Impact →
                      </button>
                    )}

                    <button className="text-zinc-500 hover:text-zinc-300">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Side-by-Side Diff */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 bg-zinc-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {/* Old Value */}
                      <div className="p-3 rounded-lg bg-red-950/10 border border-red-900/30">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-red-400 mb-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>SPEC V1 BASELINE</span>
                        </div>
                        <p className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {change.old_value}
                        </p>
                      </div>

                      {/* New Value */}
                      <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-900/30">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 mb-1.5 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>SPEC V2 REVISED</span>
                        </div>
                        <p className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {change.new_value}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
