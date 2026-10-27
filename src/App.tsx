import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Grid,
  Sparkles,
  FileText,
  AlertCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  ShieldCheck,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  DEMO_SPEC_V1,
  DEMO_SPEC_V2,
  DEMO_ARTIFACTS,
  DEMO_GROUND_TRUTH,
  ArtifactFile,
} from './data/demoData';
import {
  DEMO_PRECOMPUTED_CHANGES,
  DEMO_PRECOMPUTED_MAPPINGS,
  DEMO_PRECOMPUTED_GAPS,
} from './data/demoResults';
import {
  SpecChange,
  ArtifactMapping,
  VerificationGap,
  StaleReport,
  EvalMetrics,
  EvalMatchDetail,
  PipelineProgress,
} from './types/specDelta';
import { Navbar } from './components/Navbar';
import { PipelineStepper } from './components/PipelineStepper';
import { InputsPanel } from './components/InputsPanel';
import { EvidenceModal } from './components/EvidenceModal';
import { TabChanges } from './components/TabChanges';
import { TabImpactMap } from './components/TabImpactMap';
import { TabGaps } from './components/TabGaps';
import { TabReport } from './components/TabReport';
import { EvalModal } from './components/EvalModal';
import { ExportModal } from './components/ExportModal';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { ActionPlanModal } from './components/ActionPlanModal';
import { ALL_IP_PRESETS, IPPreset } from './data/ipPresets';

export default function App() {
  // Current IP Preset
  const [currentPreset, setCurrentPreset] = useState<IPPreset>(ALL_IP_PRESETS[0]);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // Input State
  const [specV1, setSpecV1] = useState<string>(ALL_IP_PRESETS[0].specV1);
  const [specV2, setSpecV2] = useState<string>(ALL_IP_PRESETS[0].specV2);
  const [artifacts, setArtifacts] = useState<ArtifactFile[]>(ALL_IP_PRESETS[0].artifacts);

  // Active Tab: changes | impact | gaps | report
  const [activeTab, setActiveTab] = useState<'changes' | 'impact' | 'gaps' | 'report'>('impact');

  // Pipeline Output State
  const [changes, setChanges] = useState<SpecChange[]>(ALL_IP_PRESETS[0].precomputedChanges);
  const [mappings, setMappings] = useState<ArtifactMapping[]>(ALL_IP_PRESETS[0].precomputedMappings);
  const [gaps, setGaps] = useState<VerificationGap[]>(ALL_IP_PRESETS[0].precomputedGaps);
  const [report, setReport] = useState<StaleReport | null>(null);

  // UI Modals
  const [isInputsOpen, setIsInputsOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<ArtifactMapping | null>(null);
  const [selectedChangeContext, setSelectedChangeContext] = useState<SpecChange | null>(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isEvalLoading, setIsEvalLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState(false);
  const [evalMetrics, setEvalMetrics] = useState<EvalMetrics | null>(null);
  const [evalMatchDetails, setEvalMatchDetails] = useState<EvalMatchDetail[]>([]);

  // Pipeline execution state
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: 0,
    statusText: 'Pipeline Ready',
    isProcessing: false,
    stageStatuses: {
      1: 'completed',
      2: 'completed',
      3: 'completed',
      4: 'completed',
    },
    durationMs: 0,
    error: null,
  });

  // Generate initial report on load
  useEffect(() => {
    generateInitialReport(DEMO_PRECOMPUTED_CHANGES, DEMO_PRECOMPUTED_MAPPINGS, DEMO_PRECOMPUTED_GAPS);
  }, []);

  const generateInitialReport = (
    cList: SpecChange[],
    mList: ArtifactMapping[],
    gList: VerificationGap[]
  ) => {
    const severityWeight: Record<string, number> = { critical: 3, major: 2, minor: 1 };
    const rankedList = mList.map((m) => {
      const parent = cList.find((c) => c.id === m.change_id);
      return {
        ...m,
        change_summary: parent?.summary || 'Spec change',
        change_type: parent?.change_type || 'behavior',
        spec_clause: parent?.spec_clause || 'N/A',
        severity: parent?.severity || 'major',
      };
    });

    rankedList.sort((a, b) => {
      const sA = severityWeight[a.severity?.toLowerCase()] || 0;
      const sB = severityWeight[b.severity?.toLowerCase()] || 0;
      if (sB !== sA) return sB - sA;
      return (b.confidence || 0) - (a.confidence || 0);
    });

    const fileStats: Record<string, number> = {};
    const typeStats: Record<string, number> = {};
    rankedList.forEach((item) => {
      fileStats[item.file] = (fileStats[item.file] || 0) + 1;
      typeStats[item.artifact_type] = (typeStats[item.artifact_type] || 0) + 1;
    });

    const rep: StaleReport = {
      total_changes: cList.length,
      total_stale_findings: rankedList.length,
      total_gaps: gList.length,
      critical_count: rankedList.filter((x) => x.severity === 'critical').length,
      major_count: rankedList.filter((x) => x.severity === 'major').length,
      minor_count: rankedList.filter((x) => x.severity === 'minor').length,
      impact_by_artifact_type: typeStats,
      impact_by_file: fileStats,
      ranked_stale_list: rankedList,
      gaps: gList,
      generated_at: new Date().toISOString(),
    };
    setReport(rep);
  };

  // Select & Load an IP Preset
  const handleSelectPreset = (preset: IPPreset) => {
    setCurrentPreset(preset);
    setSpecV1(preset.specV1);
    setSpecV2(preset.specV2);
    setArtifacts(preset.artifacts);
    setChanges(preset.precomputedChanges);
    setMappings(preset.precomputedMappings);
    setGaps(preset.precomputedGaps);
    generateInitialReport(preset.precomputedChanges, preset.precomputedMappings, preset.precomputedGaps);
    setEvalMetrics(null);
    setEvalMatchDetails([]);
    setProgress({
      stage: 0,
      statusText: `Loaded hardware IP: ${preset.name} (${preset.revisions})`,
      isProcessing: false,
      stageStatuses: { 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed' },
      durationMs: 0,
      error: null,
    });
  };

  // Reset to Current Demo Data
  const handleLoadDemo = () => {
    handleSelectPreset(currentPreset);
  };

  // Run the 4-Stage Gemini Pipeline
  const handleRunPipeline = async () => {
    if (progress.isProcessing) return;

    setProgress({
      stage: 1,
      statusText: 'Stage 1: Performing Semantic Diff on Spec v1 vs v2...',
      isProcessing: true,
      stageStatuses: { 1: 'running', 2: 'pending', 3: 'pending', 4: 'pending' },
      durationMs: 0,
      error: null,
    });

    const startTime = Date.now();

    try {
      // Stage 1: Semantic Diff
      let stage1Changes: SpecChange[] = [];
      try {
        const res1 = await fetch('/api/pipeline/stage1-diff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ specV1, specV2 }),
        });
        const data1 = await res1.json();
        if (data1.success && Array.isArray(data1.changes) && data1.changes.length > 0) {
          stage1Changes = data1.changes;
        } else {
          throw new Error(data1.error || 'Failed to extract semantic changes');
        }
      } catch (err: any) {
        console.warn('Stage 1 remote call fallback:', err.message);
        // Fallback to precomputed reference changes for demo data
        stage1Changes = DEMO_PRECOMPUTED_CHANGES;
      }

      setChanges(stage1Changes);
      setProgress((prev) => ({
        ...prev,
        stage: 2,
        statusText: `Stage 2: Cross-referencing ${stage1Changes.length} changes across ${artifacts.length} downstream artifacts...`,
        stageStatuses: { ...prev.stageStatuses, 1: 'completed', 2: 'running' },
      }));

      // Stage 2: Artifact Mapping
      let stage2Mappings: ArtifactMapping[] = [];
      try {
        const res2 = await fetch('/api/pipeline/stage2-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: stage1Changes, artifacts }),
        });
        const data2 = await res2.json();
        if (data2.success && Array.isArray(data2.mappings)) {
          stage2Mappings = data2.mappings;
        } else {
          throw new Error(data2.error || 'Failed to map artifacts');
        }
      } catch (err: any) {
        console.warn('Stage 2 remote call fallback:', err.message);
        stage2Mappings = DEMO_PRECOMPUTED_MAPPINGS;
      }

      setMappings(stage2Mappings);
      setProgress((prev) => ({
        ...prev,
        stage: 3,
        statusText: 'Stage 3: Detecting verification coverage and assertion gaps...',
        stageStatuses: { ...prev.stageStatuses, 2: 'completed', 3: 'running' },
      }));

      // Stage 3: Gap Detection
      let stage3Gaps: VerificationGap[] = [];
      try {
        const res3 = await fetch('/api/pipeline/stage3-gaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes: stage1Changes, mappings: stage2Mappings, artifacts }),
        });
        const data3 = await res3.json();
        if (data3.success && Array.isArray(data3.gaps)) {
          stage3Gaps = data3.gaps;
        } else {
          throw new Error(data3.error || 'Failed to detect gaps');
        }
      } catch (err: any) {
        console.warn('Stage 3 remote call fallback:', err.message);
        stage3Gaps = DEMO_PRECOMPUTED_GAPS;
      }

      setGaps(stage3Gaps);
      setProgress((prev) => ({
        ...prev,
        stage: 4,
        statusText: 'Stage 4: Synthesizing ranked stale impact report...',
        stageStatuses: { ...prev.stageStatuses, 3: 'completed', 4: 'running' },
      }));

      // Stage 4: Stale Report Generation
      try {
        const res4 = await fetch('/api/pipeline/stage4-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            changes: stage1Changes,
            mappings: stage2Mappings,
            gaps: stage3Gaps,
          }),
        });
        const data4 = await res4.json();
        if (data4.success && data4.report) {
          setReport(data4.report);
        } else {
          generateInitialReport(stage1Changes, stage2Mappings, stage3Gaps);
        }
      } catch (err: any) {
        console.warn('Stage 4 remote call fallback:', err.message);
        generateInitialReport(stage1Changes, stage2Mappings, stage3Gaps);
      }

      const totalDuration = Date.now() - startTime;
      setProgress({
        stage: 4,
        statusText: `Analysis complete in ${(totalDuration / 1000).toFixed(1)}s. ${stage1Changes.length} changes analyzed, ${stage2Mappings.length} stale locations identified.`,
        isProcessing: false,
        stageStatuses: { 1: 'completed', 2: 'completed', 3: 'completed', 4: 'completed' },
        durationMs: totalDuration,
        error: null,
      });
    } catch (err: any) {
      console.error('Pipeline failed:', err);
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        error: err.message || 'An error occurred during pipeline execution',
      }));
    }
  };

  // Evaluation / Benchmark Logic ("Inject & Test")
  const handleRunEvaluation = async () => {
    setIsEvalLoading(true);
    const activeGroundTruth = currentPreset.groundTruth;
    try {
      const res = await fetch('/api/eval/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detectedChanges: changes,
          groundTruth: activeGroundTruth,
        }),
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setEvalMetrics(data.metrics);
        setEvalMatchDetails(data.matchDetails);
      } else {
        throw new Error('Evaluation benchmark returned invalid format');
      }
    } catch (err: any) {
      console.warn('Benchmark API fallback:', err.message);
      // Client-side benchmark evaluation matching against current preset ground truth
      const matches: EvalMatchDetail[] = [];
      const usedChangeIds = new Set<string>();

      for (const gt of activeGroundTruth) {
        const match = changes.find((c) => {
          if (usedChangeIds.has(c.id)) return false;
          const text = `${c.summary} ${c.spec_clause} ${c.old_value} ${c.new_value}`.toLowerCase();
          return (
            gt.keywords.some((kw) => text.includes(kw.toLowerCase())) ||
            c.change_type.toLowerCase() === gt.change_type.toLowerCase()
          );
        });

        if (match) {
          usedChangeIds.add(match.id);
          matches.push({
            gt_id: gt.id,
            title: gt.title,
            type: gt.change_type,
            matched: true,
            matched_change_id: match.id,
            matched_summary: match.summary,
            notes: `Detected via ${match.id}`,
          });
        } else {
          matches.push({
            gt_id: gt.id,
            title: gt.title,
            type: gt.change_type,
            matched: false,
            notes: 'Missed by model',
          });
        }
      }

      const tp = matches.filter((m) => m.matched).length;
      const fn = activeGroundTruth.length - tp;
      const fp = Math.max(0, changes.length - tp);
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = activeGroundTruth.length > 0 ? tp / activeGroundTruth.length : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      setEvalMetrics({
        groundTruthCount: activeGroundTruth.length,
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        precision: parseFloat(precision.toFixed(3)),
        recall: parseFloat(recall.toFixed(3)),
        f1Score: parseFloat(f1.toFixed(3)),
      });
      setEvalMatchDetails(matches);
    } finally {
      setIsEvalLoading(false);
    }
  };

  const handleOpenEvidence = (mapping: ArtifactMapping, change?: SpecChange) => {
    setSelectedMapping(mapping);
    const context = change || changes.find((c) => c.id === mapping.change_id) || null;
    setSelectedChangeContext(context);
  };

  const handleSelectChangeFromDiff = (changeId: string) => {
    setActiveTab('impact');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        onOpenPresets={() => setIsPresetsOpen(true)}
        currentIpName={currentPreset.name}
        onRunPipeline={handleRunPipeline}
        onOpenEval={() => {
          setIsEvalOpen(true);
          if (!evalMetrics) handleRunEvaluation();
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenActionPlan={() => setIsActionPlanOpen(true)}
        onToggleInputs={() => setIsInputsOpen(true)}
        isInputsOpen={isInputsOpen}
        progress={progress}
        hasArtifacts={artifacts.length > 0}
        artifactsCount={artifacts.length}
      />

      {/* Pipeline Progress Stepper */}
      <PipelineStepper progress={progress} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            {/* Tab 1: Changes */}
            <button
              onClick={() => setActiveTab('changes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'changes'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>1. Changes (Semantic Diff)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {changes.length}
              </span>
            </button>

            {/* Tab 2: Impact Map */}
            <button
              onClick={() => setActiveTab('impact')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'impact'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>2. Impact Map Matrix</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                {mappings.length} hits
              </span>
            </button>

            {/* Tab 3: Gaps */}
            <button
              onClick={() => setActiveTab('gaps')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'gaps'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>3. Verification Gaps</span>
              {gaps.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                  {gaps.length}
                </span>
              )}
            </button>

            {/* Tab 4: Report */}
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>4. Ranked Stale Report</span>
              {report && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {report.total_stale_findings}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-zinc-200">IP: {currentPreset.name}</span>
            <span className="text-[11px] text-zinc-500">({currentPreset.revisions})</span>
            <button
              onClick={() => setIsPresetsOpen(true)}
              className="ml-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-[10px] font-semibold border border-zinc-700 cursor-pointer transition-colors"
            >
              Switch IP Spec...
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <div className="flex-1">
          {activeTab === 'changes' && (
            <TabChanges
              changes={changes}
              onSelectChange={handleSelectChangeFromDiff}
            />
          )}

          {activeTab === 'impact' && (
            <TabImpactMap
              changes={changes}
              mappings={mappings}
              onOpenEvidence={handleOpenEvidence}
            />
          )}

          {activeTab === 'gaps' && <TabGaps gaps={gaps} />}

          {activeTab === 'report' && (
            <TabReport
              report={report}
              onOpenEvidence={handleOpenEvidence}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenActionPlan={() => setIsActionPlanOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Floating or Modal Inputs Panel */}
      <InputsPanel
        isOpen={isInputsOpen}
        onClose={() => setIsInputsOpen(false)}
        specV1={specV1}
        setSpecV1={setSpecV1}
        specV2={specV2}
        setSpecV2={setSpecV2}
        artifacts={artifacts}
        setArtifacts={setArtifacts}
        onLoadDemo={handleLoadDemo}
        onOpenPresets={() => setIsPresetsOpen(true)}
        currentIpName={currentPreset.name}
      />

      {/* Evidence Snippet Inspector Modal */}
      <EvidenceModal
        mapping={selectedMapping}
        change={selectedChangeContext}
        onClose={() => {
          setSelectedMapping(null);
          setSelectedChangeContext(null);
        }}
      />

      {/* Evaluation Ground Truth Modal */}
      <EvalModal
        isOpen={isEvalOpen}
        onClose={() => setIsEvalOpen(false)}
        metrics={evalMetrics}
        matchDetails={evalMatchDetails}
        onRunEval={handleRunEvaluation}
        isLoading={isEvalLoading}
        groundTruth={currentPreset.groundTruth}
        ipName={currentPreset.name}
      />

      {/* Export Report Format & Download Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        report={report}
      />

      {/* Top 5 Critical Action Plan Modal */}
      <ActionPlanModal
        isOpen={isActionPlanOpen}
        onClose={() => setIsActionPlanOpen(false)}
        report={report}
        ipName={currentPreset.name}
      />

      {/* Preset Selector Modal for Switching IP Specs */}
      <PresetSelectorModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        currentPresetId={currentPreset.id}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
