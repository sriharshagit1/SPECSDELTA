import { StaleReportItem, StaleReport } from '../types/specDelta';

export interface ActionPlanStep {
  rank: number;
  changeId: string;
  changeSummary: string;
  severity: string;
  confidence: number;
  artifactType: string;
  file: string;
  lineRange: string;
  specClause: string;
  whyStale: string;
  evidenceSnippet: string;
  suggestedFix: string;
  refactoringSteps: string[];
  uvmTestUpdates: string[];
  status: 'pending' | 'in_progress' | 'resolved';
}

/**
 * Derives concrete refactoring steps tailored to the artifact type and change context.
 */
function deriveRefactoringSteps(item: StaleReportItem): string[] {
  const type = item.artifact_type;
  const why = item.why_stale.toLowerCase();
  const summary = item.change_summary.toLowerCase();

  if (type === 'RTL') {
    if (why.includes('polarity') || summary.includes('polarity')) {
      return [
        `Invert logic polarity on signal port in \`${item.file}\` (Lines ${item.line_range}).`,
        'Check all internal combinatorial assigns and continuous drivers.',
        'Verify reset de-assertion logic and check for unexpected active transitions during power-on.',
        'Run RTL lint (SpyGlass/Verilator) to ensure no floating or inverted drivers.'
      ];
    }
    if (why.includes('reset') || summary.includes('reset')) {
      return [
        `Update asynchronous/synchronous reset clause in \`${item.file}\` (Lines ${item.line_range}) to new default value.`,
        'Verify all register bitfields initialized in `always_ff @(posedge clk or negedge rst_n)` block.',
        'Check formal reset reachability proofs to guarantee clean reset exit.',
      ];
    }
    if (why.includes('width') || summary.includes('width') || why.includes('bit')) {
      return [
        `Widen internal register & bus slice signal declarations in \`${item.file}\` to match the new bitfield specification.`,
        'Inspect arithmetic overflow/carry bits and register write-mask decoding logic.',
        'Audit synthesis reports for datapath timing closure and setup/hold slack.',
      ];
    }
    if (why.includes('removed') || summary.includes('removed') || why.includes('deprecated')) {
      return [
        `Safely decouple deprecated bitfield/mux in \`${item.file}\` (Lines ${item.line_range}).`,
        'Tie unused internal signals to constant 0 or high-Z per ASIC low-power guidelines.',
        'Ensure register reads from this offset return zero without side effects.',
      ];
    }
    return [
      `Modify RTL logic in \`${item.file}\` (Lines ${item.line_range}) per updated specification requirements.`,
      'Review FSM state transitions and handshaking ready/valid assertions.',
      'Re-compile design and execute RTL regression suite.',
    ];
  }

  if (type === 'Assertions') {
    if (why.includes('timing') || why.includes('latency') || summary.includes('latency')) {
      return [
        `Relax clock cycle delay parameter in SVA property \`${item.file}\` (Lines ${item.line_range}).`,
        'Ensure assertion disabled during reset via `disable iff (!aresetn)`.',
        'Run formal property verification (JasperGold/VC Formal) to verify bounded latency holds under CDC.',
      ];
    }
    if (why.includes('polarity') || summary.includes('polarity')) {
      return [
        `Invert expected antecedent or consequent boolean expression in SVA property in \`${item.file}\`.`,
        'Verify concurrent property syntax `@(posedge clk)` does not sample during metastability.',
      ];
    }
    return [
      `Update assertion check in \`${item.file}\` to conform to revised specification clause.`,
      'Execute formal regression and verify zero false assertion firings.',
    ];
  }

  if (type === 'Registers') {
    return [
      `Update software driver header \`${item.file}\` with the new mask, offset, or reset definition.`,
      'Provide backwards-compatible alias macro if legacy firmware drivers share this header.',
      'Regenerate C header / RAL register definitions from gold-source SystemRDL model.',
    ];
  }

  if (type === 'UVM/TB') {
    return [
      `Update register block or component reference in \`${item.file}\` (Lines ${item.line_range}).`,
      'Refactor driver and monitor tasks to comply with updated transaction phase semantics.',
      'Re-run UVM testbench sanity testcase.',
    ];
  }

  return [
    `Update downstream file \`${item.file}\` at lines ${item.line_range}.`,
    'Synchronize with architecture team and cross-reference spec clause.',
  ];
}

/**
 * Derives specific UVM testbench updates for verification teams.
 */
function deriveUvmTestUpdates(item: StaleReportItem): string[] {
  const type = item.artifact_type;
  const why = item.why_stale.toLowerCase();
  const summary = item.change_summary.toLowerCase();

  if (why.includes('reset') || summary.includes('reset')) {
    return [
      'Update UVM RAL (Register Abstraction Layer) `default_value` property for target register field.',
      'Adapt `uvm_reg_hw_reset_seq` test to assert the new power-on reset state.',
      'Verify register scoreboard mirror value initializes to match hardware state.',
    ];
  }

  if (why.includes('polarity') || summary.includes('polarity')) {
    return [
      'Invert protocol monitor interface sampling task from active-low to active-high.',
      'Update UVM scoreboard transaction prediction logic for transfer request triggers.',
      'Run directed testcase verifying handshake acknowledgment timings.',
    ];
  }

  if (why.includes('width') || summary.includes('width')) {
    return [
      'Extend UVM sequence item constrained-random generator to stimulate the full expanded dynamic range.',
      'Add functional coverage cross-bins covering lower, mid-range, and maximum expanded values.',
      'Verify transaction scoreboard does not truncate upper payload bits.',
    ];
  }

  if (why.includes('timing') || why.includes('latency') || summary.includes('timing')) {
    return [
      'Relax driver/monitor watchdog timer thresholds in testbench interface config.',
      'Update SVA sequence checkers and formal verification bounds to prevent false test timeouts.',
      'Run stress test with randomized clock-domain crossing delays.',
    ];
  }

  if (why.includes('removed') || summary.includes('removed')) {
    return [
      'Deprecate or delete obsolete test sequences targeting this removed capability.',
      'Update negative tests to verify writing to deprecated bitfields produces no illegal state transitions.',
    ];
  }

  return [
    'Update UVM sequence stimulus generator and checker routines.',
    'Verify functional coverage model reaches 100% closure against revised spec clauses.',
  ];
}

/**
 * Generates the top 5 critical action plan items from a report.
 */
export function generateTop5ActionPlan(report: StaleReport | null): ActionPlanStep[] {
  if (!report || !report.ranked_stale_list || report.ranked_stale_list.length === 0) {
    return [];
  }

  // Take top 5 items from the ranked stale list (already sorted by severity then confidence)
  const top5Items = report.ranked_stale_list.slice(0, 5);

  return top5Items.map((item, idx) => ({
    rank: idx + 1,
    changeId: item.change_id,
    changeSummary: item.change_summary,
    severity: item.severity.toUpperCase(),
    confidence: item.confidence,
    artifactType: item.artifact_type,
    file: item.file,
    lineRange: item.line_range,
    specClause: item.spec_clause,
    whyStale: item.why_stale,
    evidenceSnippet: item.evidence_snippet,
    suggestedFix: item.suggested_fix,
    refactoringSteps: deriveRefactoringSteps(item),
    uvmTestUpdates: deriveUvmTestUpdates(item),
    status: 'pending',
  }));
}

/**
 * Exports the Action Plan as Markdown.
 */
export function exportActionPlanToMarkdown(
  actionPlan: ActionPlanStep[],
  ipName = 'Hardware IP'
): string {
  const dateStr = new Date().toLocaleString();
  let md = `# SpecDelta: Top 5 Critical Action Plan & Remediation Roadmap
Target Subsystem: ${ipName}
Generated: ${dateStr}

## Executive Action Summary
This action plan consolidates the **Top 5 Critical Stale Artifacts** discovered across RTL, registers, SVA assertions, and UVM testbenches. Resolving these items is mandatory prior to tape-out design sign-off.

---

`;

  actionPlan.forEach((plan) => {
    md += `### #${plan.rank}. [${plan.severity}] ${plan.changeId}: ${plan.changeSummary}
- **Impacted Subsystem**: ${plan.artifactType}
- **Target File**: \`${plan.file}\` (Lines ${plan.lineRange})
- **Spec Clause**: ${plan.specClause}
- **Confidence**: ${(plan.confidence * 100).toFixed(0)}%
- **Root Cause (Why Stale)**: ${plan.whyStale}

#### Specific Code Refactoring Steps:
${plan.refactoringSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

#### Specific UVM Test & Verification Updates:
${plan.uvmTestUpdates.map((s, i) => `${i + 1}. ${s}`).join('\n')}

#### Before: Quoted Stale Code
\`\`\`
${plan.evidenceSnippet}
\`\`\`

#### After: Suggested Code Remediation
\`\`\`
${plan.suggestedFix}
\`\`\`

---
`;
  });

  md += `\n*End of Action Plan. All 5 items must achieve 100% review and regression pass status.*`;
  return md;
}
