import { StaleReport, StaleReportItem } from '../types/specDelta';

export interface ExportOptions {
  format: 'csv' | 'markdown';
  minSeverity?: 'all' | 'critical' | 'major';
  minConfidence?: number;
  includeGaps?: boolean;
  includeCodeSnippets?: boolean;
}

export function filterReportItems(
  items: StaleReportItem[],
  minSeverity: 'all' | 'critical' | 'major' = 'all',
  minConfidence = 0
): StaleReportItem[] {
  return items.filter((item) => {
    if (minSeverity === 'critical' && item.severity.toLowerCase() !== 'critical') {
      return false;
    }
    if (
      minSeverity === 'major' &&
      item.severity.toLowerCase() !== 'critical' &&
      item.severity.toLowerCase() !== 'major'
    ) {
      return false;
    }
    if (item.confidence < minConfidence) {
      return false;
    }
    return true;
  });
}

export function exportReportToMarkdown(
  report: StaleReport,
  options: Partial<ExportOptions> = {}
): string {
  const {
    minSeverity = 'all',
    minConfidence = 0,
    includeGaps = true,
    includeCodeSnippets = true,
  } = options;

  const dateStr = new Date(report.generated_at).toLocaleString();
  const items = filterReportItems(report.ranked_stale_list, minSeverity, minConfidence);

  let md = `# SpecDelta: Hardware Spec Change Impact Report
Generated: ${dateStr}

## Executive Summary
- **Total Spec Delta Changes**: ${report.total_changes}
- **Total Stale Downstream Findings Evaluated**: ${report.total_stale_findings}
- **Filtered Exported Findings**: ${items.length}
  - Critical Severity: ${items.filter((x) => x.severity === 'critical').length}
  - Major Severity: ${items.filter((x) => x.severity === 'major').length}
  - Minor Severity: ${items.filter((x) => x.severity === 'minor').length}
- **Verification Gaps Detected**: ${report.total_gaps}

---

## 1. Ranked Stale Artifacts List
*Sorted by Severity (Critical > Major > Minor) then Confidence (1.0 -> 0.0)*

| Rank | Change ID | Severity | Confidence | Artifact Type | File & Lines | Spec Clause | Why Stale |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  items.forEach((item: StaleReportItem, idx: number) => {
    md += `| ${idx + 1} | **${item.change_id}** | \`${item.severity.toUpperCase()}\` | ${(item.confidence * 100).toFixed(0)}% | ${item.artifact_type} | \`${item.file}:${item.line_range}\` | ${item.spec_clause} | ${item.why_stale.replace(/\|/g, '\\|')} |\n`;
  });

  if (includeCodeSnippets) {
    md += `\n---

## 2. Detailed Stale Findings & Evidence Snippets

`;

    items.forEach((item: StaleReportItem, idx: number) => {
      md += `### ${idx + 1}. [${item.severity.toUpperCase()}] ${item.change_id}: ${item.change_summary}
- **Spec Clause**: ${item.spec_clause}
- **Impacted File**: \`${item.file}\` (Lines ${item.line_range})
- **Artifact Type**: ${item.artifact_type}
- **Confidence**: ${(item.confidence * 100).toFixed(0)}%
- **Why Stale**: ${item.why_stale}

**Quoted Evidence Snippet from File:**
\`\`\`
${item.evidence_snippet}
\`\`\`

**Suggested Non-Destructive Remediation:**
\`\`\`
${item.suggested_fix}
\`\`\`

---
`;
    });
  }

  if (includeGaps && report.gaps && report.gaps.length > 0) {
    md += `\n## 3. Verification & Testbench Gaps
*Spec changes with NO corresponding assertions, coverage bins, or test cases*

| Change ID | Feature Summary | Missing Artifacts | Recommended Action |
| :--- | :--- | :--- | :--- |
`;
    report.gaps.forEach((gap) => {
      md += `| **${gap.change_id}** | ${gap.change_summary.replace(/\|/g, '\\|')} | ${gap.missing_artifacts.join(', ')} | ${gap.recommendation.replace(/\|/g, '\\|')} |\n`;
    });
  }

  md += `\n## 4. EDA Sign-off & Audit Notice
*Report generated automatically by SpecDelta EDA Analyzer. Manual verification by design lead required prior to RTL tape-out.*
`;

  return md;
}

export function exportReportToCSV(
  report: StaleReport,
  options: Partial<ExportOptions> = {}
): string {
  const {
    minSeverity = 'all',
    minConfidence = 0,
    includeGaps = true,
  } = options;

  const items = filterReportItems(report.ranked_stale_list, minSeverity, minConfidence);

  const headers = [
    'Rank',
    'Change_ID',
    'Severity',
    'Confidence',
    'Artifact_Type',
    'File',
    'Line_Range',
    'Spec_Clause',
    'Change_Summary',
    'Why_Stale',
    'Evidence_Snippet',
    'Suggested_Fix',
  ];

  const escapeCSV = (str: string | number) => {
    if (str === undefined || str === null) return '""';
    const text = String(str);
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = items.map((item, idx) => [
    escapeCSV(idx + 1),
    escapeCSV(item.change_id),
    escapeCSV(item.severity.toUpperCase()),
    escapeCSV((item.confidence * 100).toFixed(0) + '%'),
    escapeCSV(item.artifact_type),
    escapeCSV(item.file),
    escapeCSV(item.line_range),
    escapeCSV(item.spec_clause),
    escapeCSV(item.change_summary),
    escapeCSV(item.why_stale),
    escapeCSV(item.evidence_snippet),
    escapeCSV(item.suggested_fix),
  ]);

  let csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  // If gaps are included, append a secondary section for verification gaps
  if (includeGaps && report.gaps && report.gaps.length > 0) {
    const gapHeaders = [
      'Record_Type',
      'Change_ID',
      'Feature_Summary',
      'Missing_Artifacts',
      'Recommendation',
    ];
    const gapRows = report.gaps.map((gap) => [
      escapeCSV('VERIFICATION_GAP'),
      escapeCSV(gap.change_id),
      escapeCSV(gap.change_summary),
      escapeCSV(gap.missing_artifacts.join('; ')),
      escapeCSV(gap.recommendation),
    ]);
    csvContent += '\r\n\r\n' + [gapHeaders.join(','), ...gapRows.map((r) => r.join(','))].join('\r\n');
  }

  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
