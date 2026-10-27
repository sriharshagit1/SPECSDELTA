import React, { useState } from 'react';
import {
  Grid,
  Filter,
  Search,
  Sliders,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { SpecChange, ArtifactMapping, ArtifactType } from '../types/specDelta';

interface TabImpactMapProps {
  changes: SpecChange[];
  mappings: ArtifactMapping[];
  onOpenEvidence: (mapping: ArtifactMapping, change: SpecChange) => void;
}

const ARTIFACT_COLUMNS: ArtifactType[] = [
  'RTL',
  'Registers',
  'UVM/TB',
  'Assertions',
  'Coverage',
  'Testplan',
];

export const TabImpactMap: React.FC<TabImpactMapProps> = ({
  changes,
  mappings,
  onOpenEvidence,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTypeCol, setSelectedTypeCol] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  // Group mappings by change_id and artifact_type
  const mappingLookup = new Map<string, ArtifactMapping[]>();
  mappings.forEach((m) => {
    const key = `${m.change_id}_${m.artifact_type}`;
    const list = mappingLookup.get(key) || [];
    list.push(m);
    mappingLookup.set(key, list);
  });

  const filteredChanges = changes.filter((c) => {
    const matchesSearch =
      c.summary.toLowerCase().includes(search.toLowerCase()) ||
      c.spec_clause.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'all' || c.severity.toLowerCase() === selectedSeverity.toLowerCase();

    return matchesSearch && matchesSeverity;
  });

  const visibleColumns =
    selectedTypeCol === 'all'
      ? ARTIFACT_COLUMNS
      : ARTIFACT_COLUMNS.filter((col) => col === selectedTypeCol);

  return (
    <div className="space-y-6">
      {/* Legend & Filter Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search changes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-zinc-500 font-medium">Severity:</span>
          {['all', 'critical', 'major', 'minor'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors cursor-pointer ${
                selectedSeverity === sev
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Column Filter */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-zinc-500 font-medium">Column:</span>
          <select
            value={selectedTypeCol}
            onChange={(e) => setSelectedTypeCol(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none font-mono"
          >
            <option value="all">All Artifact Types</option>
            {ARTIFACT_COLUMNS.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Confidence Threshold Slider */}
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
            className="w-24 accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1">
        <div className="flex items-center space-x-4">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Staleness Confidence:
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-600 inline-block" />
            <span className="text-emerald-400 font-mono text-[11px]">≥ 80% (High Stale)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-950 border border-amber-600 inline-block" />
            <span className="text-amber-400 font-mono text-[11px]">60-79% (Medium Stale)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-yellow-950 border border-yellow-600 inline-block" />
            <span className="text-yellow-400 font-mono text-[11px]">&lt; 60% (Low Stale)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800 inline-block" />
            <span className="text-zinc-500 font-mono text-[11px]">Clean / Unaffected</span>
          </div>
        </div>

        <span className="text-[11px] text-zinc-500 italic mt-1 sm:mt-0">
          Tip: Click any colored cell to inspect quoted code evidence & suggested fixes
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-72 shrink-0">Spec Delta Change</th>
                <th className="py-3.5 px-3 w-24 text-center">Severity</th>
                {visibleColumns.map((col) => (
                  <th key={col} className="py-3.5 px-3 text-center">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
              {filteredChanges.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 2}
                    className="py-12 text-center text-zinc-500 text-xs"
                  >
                    No specification changes match filters.
                  </td>
                </tr>
              ) : (
                filteredChanges.map((change) => {
                  return (
                    <tr
                      key={change.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Change Description */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-xs font-bold text-cyan-400">
                            {change.id}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800">
                            {change.spec_clause}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-zinc-400">
                            {change.change_type}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium line-clamp-1">
                          {change.summary}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3 text-center">
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
                      </td>

                      {/* Artifact Type Matrix Columns */}
                      {visibleColumns.map((col) => {
                        const cellMappings = (
                          mappingLookup.get(`${change.id}_${col}`) || []
                        ).filter((m) => m.confidence >= minConfidence);

                        if (cellMappings.length === 0) {
                          return (
                            <td
                              key={col}
                              className="py-3 px-3 text-center text-zinc-700 select-none"
                            >
                              <span className="inline-block w-8 text-center text-zinc-700">
                                —
                              </span>
                            </td>
                          );
                        }

                        // Pick highest confidence mapping if multiple
                        const primaryMapping = [...cellMappings].sort(
                          (a, b) => b.confidence - a.confidence
                        )[0];
                        const confPct = Math.round(primaryMapping.confidence * 100);

                        const cellStyle =
                          confPct >= 80
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900 shadow-sm shadow-emerald-950/50'
                            : confPct >= 60
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900 shadow-sm shadow-amber-950/50'
                            : 'bg-yellow-950/80 text-yellow-300 border-yellow-700/80 hover:bg-yellow-900';

                        return (
                          <td key={col} className="py-3 px-3 text-center">
                            <button
                              onClick={() => onOpenEvidence(primaryMapping, change)}
                              title={`Click to view evidence in ${primaryMapping.file} (L:${primaryMapping.line_range})`}
                              className={`w-full py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer group/cell ${cellStyle}`}
                            >
                              <div className="flex items-center justify-center space-x-1 font-bold text-xs">
                                <span>{confPct}%</span>
                                {cellMappings.length > 1 && (
                                  <span className="text-[10px] opacity-75 font-normal">
                                    (+{cellMappings.length - 1})
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] truncate max-w-[100px] mx-auto opacity-75 group-hover/cell:opacity-100 mt-0.5">
                                L:{primaryMapping.line_range}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
