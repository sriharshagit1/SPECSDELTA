var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
app.post("/api/pipeline/stage1-diff", async (req, res) => {
  try {
    const { specV1, specV2 } = req.body;
    if (!specV1 || !specV2) {
      return res.status(400).json({ error: "Both specV1 and specV2 are required" });
    }
    const systemInstruction = `You are a Principal Semiconductor Verification & Silicon Architecture Expert.
Analyze two revisions of a hardware specification (v1 and v2) for a semiconductor design (IP block/SoC).
Perform a strict semantic diff:
- Identify genuine functional, architectural, interface, register, timing, polarity, or protocol changes.
- IGNORE wording-only, stylistic, typographical, or cosmetic changes.
- Categorize each change into one of:
  "width" | "reset_value" | "new_feature" | "removed" | "timing" | "polarity" | "rename" | "behavior"
- Determine severity:
  "critical" (breaks pinout, bus compatibility, or reset behavior)
  "major" (new modes, timing relaxation, renamed registers, widened fields)
  "minor" (internal behavior adjustments, relaxed timeouts, auxiliary status)
- Output structured JSON matching the provided schema. Give each change an ID like "CHG-1", "CHG-2", etc.`;
    const prompt = `Compare Spec v1 and Spec v2 below and extract all semantic delta changes:

=== SPEC V1 ===
${specV1}

=== SPEC V2 ===
${specV2}

Extract all functional/spec changes. For each change, capture the exact clause reference, the old value, the new value, concise summary, change type, and severity.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              id: { type: import_genai.Type.STRING, description: "Unique identifier, e.g. CHG-1" },
              change_type: {
                type: import_genai.Type.STRING,
                description: "One of: width, reset_value, new_feature, removed, timing, polarity, rename, behavior"
              },
              spec_clause: { type: import_genai.Type.STRING, description: "Clause or section in the spec" },
              old_value: { type: import_genai.Type.STRING, description: "Value or behavior in Spec v1" },
              new_value: { type: import_genai.Type.STRING, description: "Value or behavior in Spec v2" },
              summary: { type: import_genai.Type.STRING, description: "Clear summary of what changed" },
              severity: {
                type: import_genai.Type.STRING,
                description: "One of: critical, major, minor"
              }
            },
            required: ["id", "change_type", "spec_clause", "old_value", "new_value", "summary", "severity"]
          }
        }
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return res.json({ success: true, changes: parsed });
  } catch (err) {
    console.error("Stage 1 error:", err);
    return res.status(500).json({ error: err.message || "Stage 1 semantic diff failed" });
  }
});
app.post("/api/pipeline/stage2-map", async (req, res) => {
  try {
    const { changes, artifacts } = req.body;
    if (!changes || !artifacts || !Array.isArray(changes) || !Array.isArray(artifacts)) {
      return res.status(400).json({ error: "changes and artifacts arrays are required" });
    }
    const systemInstruction = `You are a Senior Silicon Design & Verification Engineer doing staleness impact analysis.
You are given a list of hardware specification delta changes and a set of downstream design artifacts (RTL, Register headers, SVA assertions, UVM testbench, Coverage models, Test plans).

CRITICAL RULES:
1. NEVER claim an artifact is stale without quoting a real evidence snippet directly from the file!
2. If unsure or if the artifact is not affected by that specific change, DO NOT make up an impact. Set low confidence or omit.
3. Do not auto-modify files; "suggested_fix" is a suggested modification snippet only.
4. "line_range": approximate line numbers (e.g. "42-45" or "18") based on the artifact content provided.
5. "confidence": float between 0.1 and 1.0. High confidence (0.85-1.0) means an exact code macro, wire width, assertion cycle, or register name mismatch was found in the text.
6. "artifact_type": one of "RTL", "Registers", "UVM/TB", "Assertions", "Coverage", "Testplan".`;
    const artifactsFormatted = artifacts.map(
      (art) => `--- ARTIFACT FILE: ${art.name} (Type: ${art.type}) ---
${art.content}
`
    ).join("\n\n");
    const prompt = `Analyze which downstream artifacts are now STALE because of these specification changes.

SPEC CHANGES:
${JSON.stringify(changes, null, 2)}

DOWNSTREAM ARTIFACTS:
${artifactsFormatted}

For each match where an artifact contains obsolete logic, masks, assertions, register names, reset values, or polarities:
Return structured JSON array of stale mappings. Include the exact evidence snippet quoted from the file!`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              change_id: { type: import_genai.Type.STRING, description: "ID of the matching spec change, e.g. CHG-1" },
              file: { type: import_genai.Type.STRING, description: "Artifact filename where stale code exists" },
              line_range: { type: import_genai.Type.STRING, description: "Line range, e.g. 42-45" },
              artifact_type: { type: import_genai.Type.STRING, description: "RTL, Registers, UVM/TB, Assertions, Coverage, or Testplan" },
              evidence_snippet: { type: import_genai.Type.STRING, description: "EXACT code or text snippet quoted from the artifact file" },
              why_stale: { type: import_genai.Type.STRING, description: "Explanation of why this artifact code is stale based on the new spec" },
              confidence: { type: import_genai.Type.NUMBER, description: "Confidence score from 0.0 to 1.0" },
              suggested_fix: { type: import_genai.Type.STRING, description: "Suggested fix or code modification" }
            },
            required: ["change_id", "file", "line_range", "artifact_type", "evidence_snippet", "why_stale", "confidence", "suggested_fix"]
          }
        }
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return res.json({ success: true, mappings: parsed });
  } catch (err) {
    console.error("Stage 2 error:", err);
    return res.status(500).json({ error: err.message || "Stage 2 artifact mapping failed" });
  }
});
app.post("/api/pipeline/stage3-gaps", async (req, res) => {
  try {
    const { changes, mappings, artifacts } = req.body;
    if (!changes || !mappings) {
      return res.status(400).json({ error: "changes and mappings are required" });
    }
    const systemInstruction = `You are a Semiconductor Design Verification Lead identifying coverage and assertion gaps.
A "gap" occurs when a spec delta change has NO corresponding verification or implementation artifact (e.g., a brand new feature or mode with no SVA assertion, no coverage bin, and no test plan entry; or a new interrupt with no testcase).
Check all changes against the mappings and artifacts available. Identify gaps where verification blind spots exist.`;
    const prompt = `Identify verification and coverage gaps for these spec changes.

SPEC CHANGES:
${JSON.stringify(changes, null, 2)}

EXISTING STALE MAPPINGS:
${JSON.stringify(mappings, null, 2)}

ARTIFACTS PROVIDED:
${artifacts ? artifacts.map((a) => `${a.name} (${a.type})`).join(", ") : "None"}

Return a JSON array of gaps: changes with missing assertions, coverage bins, or test cases.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              change_id: { type: import_genai.Type.STRING, description: "ID of the change with gaps" },
              change_summary: { type: import_genai.Type.STRING, description: "Summary of the spec change" },
              missing_artifacts: {
                type: import_genai.Type.ARRAY,
                items: { type: import_genai.Type.STRING },
                description: 'List of missing artifact types, e.g. ["Assertions", "Coverage", "Testplan"]'
              },
              recommendation: { type: import_genai.Type.STRING, description: "Specific actionable recommendation for verification team" }
            },
            required: ["change_id", "change_summary", "missing_artifacts", "recommendation"]
          }
        }
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    return res.json({ success: true, gaps: parsed });
  } catch (err) {
    console.error("Stage 3 error:", err);
    return res.status(500).json({ error: err.message || "Stage 3 gap detection failed" });
  }
});
app.post("/api/pipeline/stage4-report", async (req, res) => {
  try {
    const { changes, mappings, gaps } = req.body;
    const severityWeight = {
      critical: 3,
      major: 2,
      minor: 1
    };
    const rankedStaleList = (mappings || []).map((m) => {
      const parentChange = (changes || []).find((c) => c.id === m.change_id);
      return {
        ...m,
        change_summary: parentChange ? parentChange.summary : "Spec change",
        change_type: parentChange ? parentChange.change_type : "unknown",
        spec_clause: parentChange ? parentChange.spec_clause : "N/A",
        severity: parentChange ? parentChange.severity : "major"
      };
    });
    rankedStaleList.sort((a, b) => {
      const sA = severityWeight[a.severity?.toLowerCase()] || 0;
      const sB = severityWeight[b.severity?.toLowerCase()] || 0;
      if (sB !== sA) return sB - sA;
      return (b.confidence || 0) - (a.confidence || 0);
    });
    const fileStats = {};
    const typeStats = {};
    for (const item of rankedStaleList) {
      fileStats[item.file] = (fileStats[item.file] || 0) + 1;
      typeStats[item.artifact_type] = (typeStats[item.artifact_type] || 0) + 1;
    }
    const report = {
      total_changes: (changes || []).length,
      total_stale_findings: rankedStaleList.length,
      total_gaps: (gaps || []).length,
      critical_count: rankedStaleList.filter((x) => x.severity === "critical").length,
      major_count: rankedStaleList.filter((x) => x.severity === "major").length,
      minor_count: rankedStaleList.filter((x) => x.severity === "minor").length,
      impact_by_artifact_type: typeStats,
      impact_by_file: fileStats,
      ranked_stale_list: rankedStaleList,
      gaps: gaps || [],
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    return res.json({ success: true, report });
  } catch (err) {
    console.error("Stage 4 error:", err);
    return res.status(500).json({ error: err.message || "Stage 4 report generation failed" });
  }
});
app.post("/api/eval/benchmark", async (req, res) => {
  try {
    const { detectedChanges, groundTruth } = req.body;
    if (!detectedChanges || !groundTruth) {
      return res.status(400).json({ error: "detectedChanges and groundTruth are required" });
    }
    const matches = [];
    const usedDetectedIds = /* @__PURE__ */ new Set();
    for (const gt of groundTruth) {
      const matchedChange = detectedChanges.find((dc) => {
        if (usedDetectedIds.has(dc.id)) return false;
        const text = `${dc.summary} ${dc.spec_clause} ${dc.old_value} ${dc.new_value}`.toLowerCase();
        const keywords = gt.keywords || [];
        const keywordMatch = keywords.some((kw) => text.includes(kw.toLowerCase()));
        const typeMatch = dc.change_type?.toLowerCase() === gt.change_type?.toLowerCase();
        return keywordMatch || typeMatch && keywords.some((k) => text.includes(k.slice(0, 4).toLowerCase()));
      });
      if (matchedChange) {
        usedDetectedIds.add(matchedChange.id);
        matches.push({
          gt_id: gt.id,
          title: gt.title,
          type: gt.change_type,
          matched: true,
          matched_change_id: matchedChange.id,
          matched_summary: matchedChange.summary,
          notes: `Detected via ${matchedChange.id} (${matchedChange.change_type})`
        });
      } else {
        matches.push({
          gt_id: gt.id,
          title: gt.title,
          type: gt.change_type,
          matched: false,
          notes: "Missed by semantic diff model"
        });
      }
    }
    const truePositives = matches.filter((m) => m.matched).length;
    const falseNegatives = groundTruth.length - truePositives;
    const falsePositives = Math.max(0, detectedChanges.length - truePositives);
    const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall = groundTruth.length > 0 ? truePositives / groundTruth.length : 0;
    const f1Score = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    return res.json({
      success: true,
      metrics: {
        groundTruthCount: groundTruth.length,
        truePositives,
        falsePositives,
        falseNegatives,
        precision: parseFloat(precision.toFixed(3)),
        recall: parseFloat(recall.toFixed(3)),
        f1Score: parseFloat(f1Score.toFixed(3))
      },
      matchDetails: matches
    });
  } catch (err) {
    console.error("Eval benchmark error:", err);
    return res.status(500).json({ error: err.message || "Benchmark evaluation failed" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.resolve(__dirname, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`SpecDelta server running on http://localhost:${PORT}`);
  });
}
startServer();
