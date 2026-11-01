# SpecDelta ⚡

> **EDA Spec-Change Impact & Staleness Analyzer for Semiconductor Design Teams**

SpecDelta is an AI-powered Electronic Design Automation (EDA) impact analysis platform for ASIC, SoC, and FPGA engineering teams. When a hardware architecture specification evolves from revision $v_1$ to revision $v_2$, SpecDelta cross-references downstream design collateral—**RTL (`.v`, `.sv`), Register Definitions (`.h`, `.rdl`, `.json`, `.csv`), UVM Testbenches (`.sv`), SVA Assertions (`.sva`), Functional Coverage models, and Test Plans**—to pinpoint stale code and verification blind spots before tapeout.

---

## 🚀 Key Features

- **4-Stage Structured AI Pipeline**: Powered by Google Gemini with strict structured JSON schemas.
- **Strict Evidence Requirement**: Zero hallucinated staleness—SpecDelta will never flag an artifact as stale without quoting exact, verbatim lines of code from the file.
- **Verification Gap Radar**: Instantly flags new features, modes, or interrupts introduced in $v_2$ that have zero assertions, no test plan entry, and no UVM coverage bins.
- **Top 5 Critical Action Plan**: Consolidated dual-track remediation modal with side-by-side patch diffs and specific refactoring steps for RTL designers and UVM verification engineers.
- **Ground Truth Evaluation Mode ("Inject & Test")**: Built-in benchmarking engine measuring detection Precision, Recall, and $F_1$ Score against planted specification changes.
- **Multi-Format Export Engine**: Download comprehensive 12-column CSV spreadsheets or executive Markdown reports with configurable severity and gap scopes.
- **Recursive Directory Drag & Drop**: Drop complete IP directory trees; SpecDelta automatically classifies files into RTL, Registers, UVM/TB, Assertions, Coverage, and Test Plans.
- **Domain IP Presets**: Out-of-the-box demo test cases for **AXI UART / DMA**, **PCIe Gen5 Controller / PHY**, and **Octal SPI / XIP Flash**.

---

## 🔬 4-Stage Analysis Pipeline

```
  ┌────────────────────────────────────────────────────────┐
  │  Stage 1: Semantic Spec Diff                           │
  │  Filters cosmetic wording; extracts functional deltas  │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 2: Downstream Artifact Mapping                  │
  │  Cross-references RTL, regs, TBs; quotes verbatim code │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 3: Verification Gap Detection                   │
  │  Identifies untested new features, modes, interrupts   │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 4: Ranked Stale Report                          │
  │  Sorts by Architectural Severity and AI Confidence     │
  └────────────────────────────────────────────────────────┘
```

1. **Stage 1 — Semantic Diff**: Distinguishes structural hardware changes from cosmetic text edits. Emits:
   `{ id, change_type, spec_clause, old_value, new_value, summary, severity }`
   Categories: *Width, Reset Value, Timing, Polarity, Feature, Removed, Rename, Behavior*.
2. **Stage 2 — Artifact Mapping**: Searches every line of downstream files. Emits:
   `{ change_id, file, line_range, artifact_type, evidence_snippet, why_stale, confidence, suggested_fix }`.
3. **Stage 3 — Gap Detection**: Discovers architectural additions that have no corresponding SVA checks, coverage bins, or test cases.
4. **Stage 4 — Ranked Report**: Prioritizes stale artifacts by `Severity` (`Critical` $\to$ `Major` $\to$ `Minor`) and `Confidence Score` ($1.0 \to 0.0$).

---

## 📦 Semiconductor IP Presets

SpecDelta ships with three representative semiconductor IP benchmark cases:

| Preset | Target Subsystem | Key Injected Deltas | Included Collateral |
| :--- | :--- | :--- | :--- |
| **AXI UART / DMA** | SoC Peripheral | 8 planted changes: FIFO expansion ($8 \to 16$ bits), parity enable polarity inverted, `BAUD_DIV` renamed to `BAUD_PRESCALE`, CTS/RTS timing relaxed ($3 \to 5$ cycles), removed loopback bit, burst mode added, new parity error interrupt. | `uart_top.sv`, `uart_tx.sv`, `uart_regs.h`, `uart_sva.sv`, `uart_testplan.md` |
| **PCIe Gen5 Controller** | High-Speed Serial PHY / Controller | 32 GT/s equalization preset matrix, LTSSM Recovery entry state timeout extension, credit buffer allocation. | Controller RTL, equalization state machine, PHY configuration headers, UVM sequence files. |
| **Octal SPI / XIP Flash** | Non-Volatile Memory Interface | DTR (Double Transfer Rate) clock phasing, dummy cycle latency cycle changes, byte-ordering register updates. | Core SPI RTL, timing assertions, memory testbench models, register mapping definitions. |
| **Custom Upload** | Any IP / Subsystem | Ingest your own $v_1$ / $v_2$ specs and downstream file trees via drag-and-drop. | RTL, headers, TBs, assertions, coverage, test plans. |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS (v4), Motion, Lucide Icons
- **Backend / API**: Node.js, Express, ESBuild, Vite
- **AI Engine**: `@google/genai` (Gemini 2.5 Flash) with structured JSON schemas
- **Architecture**: Zero-API-key client surface; all AI requests are secured and rate-limited via server-side `/api/*` proxy routes with seamless local reference fallbacks.

---

## ⚡ Quickstart

### Prerequisites

- Node.js 20+ installed
- npm or bun
- Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/specdelta.git
cd specdelta
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```

*(Note: If no API key is provided, SpecDelta automatically engages its built-in local reference dataset so all features and evaluation modes remain functional).*

### 3. Start Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:3000`.

### 4. Build for Production

```bash
# Builds Vite client & bundles server with esbuild
npm run build

# Runs production server
npm start
```

---

## 📁 Repository Structure

```
.
├── .env.example                # Example environment variables
├── index.html                  # HTML entry point with metadata
├── metadata.json               # Applet capabilities & metadata
├── package.json                # Project dependencies & scripts
├── server.ts                   # Express server with Gemini API proxy
├── src/
│   ├── App.tsx                 # Master state & tab coordinator
│   ├── main.tsx                # React DOM root entry
│   ├── index.css               # Tailwind CSS v4 entry
│   ├── components/
│   │   ├── Navbar.tsx          # Action bar & preset switcher
│   │   ├── PipelineStepper.tsx # 4-stage pipeline progress indicator
│   │   ├── InputsPanel.tsx     # 4-area input manager with folder drag-and-drop
│   │   ├── TabChanges.tsx      # Semantic Spec Diff viewer
│   │   ├── TabImpactMap.tsx    # 2D Impact Matrix Heatmap
│   │   ├── TabGaps.tsx         # Verification Gap Radar
│   │   ├── TabReport.tsx       # Ranked Stale Artifacts list
│   │   ├── ActionPlanModal.tsx # Top 5 Critical Action Plan & Patch Diffs
│   │   ├── EvalModal.tsx       # "Inject & Test" Benchmark Evaluation
│   │   ├── EvidenceModal.tsx   # Quoted code snippet inspector
│   │   ├── ExportModal.tsx     # CSV / Markdown export configuration
│   │   └── PresetSelectorModal.tsx # IP Preset selector
│   ├── data/
│   │   ├── demoData.ts         # UART/DMA collateral & ground truth
│   │   ├── demoResults.ts      # Reference analysis datasets
│   │   └── ipPresets.ts        # PCIe Gen5 and Octal SPI presets
│   ├── types/
│   │   └── specDelta.ts        # TypeScript schemas & pipeline models
│   └── utils/
│       ├── actionPlanUtils.ts  # Remediation & patch generation logic
│       ├── artifactClassifier.ts # Recursive folder reader & categorizer
│       └── exportUtils.ts      # CSV and Markdown generators
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite & Tailwind configuration
```

---

## 🔒 Safety & Non-Destructive Principles

- **Read-Only / Suggestion-Only**: SpecDelta provides actionable suggestions, syntax-highlighted diffs, and downloadable patches. It will **never** silently overwrite or auto-modify repository source files.
- **Citations Required**: An artifact will not be deemed stale unless an exact line range and code quote can be cited as evidence.
- **Fail-Safe Fallback**: If network calls or API limits are encountered, the system provides transparent local baseline intelligence so engineering workflows are never blocked.

---

## 📄 License

Apache License 2.0. See [LICENSE](LICENSE) for details.
