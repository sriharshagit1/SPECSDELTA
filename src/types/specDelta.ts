export type ChangeType =
  | 'width'
  | 'reset_value'
  | 'new_feature'
  | 'removed'
  | 'timing'
  | 'polarity'
  | 'rename'
  | 'behavior';

export type Severity = 'critical' | 'major' | 'minor';

export type ArtifactType =
  | 'RTL'
  | 'Registers'
  | 'UVM/TB'
  | 'Assertions'
  | 'Coverage'
  | 'Testplan';

export interface SpecChange {
  id: string;
  change_type: ChangeType;
  spec_clause: string;
  old_value: string;
  new_value: string;
  summary: string;
  severity: Severity;
}

export interface ArtifactMapping {
  change_id: string;
  file: string;
  line_range: string;
  artifact_type: ArtifactType;
  evidence_snippet: string;
  why_stale: string;
  confidence: number;
  suggested_fix: string;
}

export interface VerificationGap {
  change_id: string;
  change_summary: string;
  missing_artifacts: string[];
  recommendation: string;
}

export interface StaleReportItem extends ArtifactMapping {
  change_summary: string;
  change_type: ChangeType;
  spec_clause: string;
  severity: Severity;
}

export interface StaleReport {
  total_changes: number;
  total_stale_findings: number;
  total_gaps: number;
  critical_count: number;
  major_count: number;
  minor_count: number;
  impact_by_artifact_type: Record<string, number>;
  impact_by_file: Record<string, number>;
  ranked_stale_list: StaleReportItem[];
  gaps: VerificationGap[];
  generated_at: string;
}

export interface EvalMetrics {
  groundTruthCount: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
}

export interface EvalMatchDetail {
  gt_id: string;
  title: string;
  type: string;
  matched: boolean;
  matched_change_id?: string;
  matched_summary?: string;
  notes: string;
}

export interface PipelineProgress {
  stage: 0 | 1 | 2 | 3 | 4; // 0=idle, 1=diff, 2=map, 3=gaps, 4=report
  statusText: string;
  isProcessing: boolean;
  stageStatuses: {
    1: 'pending' | 'running' | 'completed' | 'error';
    2: 'pending' | 'running' | 'completed' | 'error';
    3: 'pending' | 'running' | 'completed' | 'error';
    4: 'pending' | 'running' | 'completed' | 'error';
  };
  durationMs: number;
  error?: string | null;
}
