import { ArtifactType } from '../types/specDelta';
import { ArtifactFile } from '../data/demoData';

export interface ClassificationResult {
  type: ArtifactType;
  language: string;
}

/**
 * Categorizes a file by analyzing its relative path, file extension, and optional content snippets.
 */
export function classifyArtifact(
  filePath: string,
  content = ''
): ClassificationResult {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  const fileName = normalizedPath.split('/').pop() || '';
  const ext = fileName.split('.').pop() || '';

  // 1. SVA Assertions check
  if (
    ext === 'sva' ||
    fileName.includes('_sva') ||
    fileName.includes('_assert') ||
    fileName.includes('_bind') ||
    normalizedPath.includes('/sva/') ||
    normalizedPath.includes('/assertions/') ||
    normalizedPath.includes('/formal/') ||
    (content && (content.includes('assert property') || content.includes('assume property') || content.includes('sequence p_')))
  ) {
    return { type: 'Assertions', language: 'systemverilog' };
  }

  // 2. Functional Coverage check
  if (
    ext === 'cov' ||
    fileName.includes('_cov') ||
    fileName.includes('_coverage') ||
    normalizedPath.includes('/cov/') ||
    normalizedPath.includes('/coverage/') ||
    normalizedPath.includes('/fcov/') ||
    (content && (content.includes('covergroup') || content.includes('coverpoint')))
  ) {
    return { type: 'Coverage', language: 'systemverilog' };
  }

  // 3. UVM / Testbench check
  if (
    fileName.includes('_tb') ||
    fileName.includes('_testbench') ||
    fileName.includes('_env') ||
    fileName.includes('_agent') ||
    fileName.includes('_driver') ||
    fileName.includes('_monitor') ||
    fileName.includes('_seq') ||
    fileName.includes('_scoreboard') ||
    fileName.includes('_pkg') ||
    fileName.includes('_test') ||
    normalizedPath.includes('/tb/') ||
    normalizedPath.includes('/testbench/') ||
    normalizedPath.includes('/uvm/') ||
    normalizedPath.includes('/tests/') ||
    normalizedPath.includes('/agents/') ||
    normalizedPath.includes('/env/') ||
    normalizedPath.includes('/sequences/') ||
    (content && (content.includes('extends uvm_') || content.includes('`uvm_component_utils') || content.includes('`uvm_info')))
  ) {
    return { type: 'UVM/TB', language: 'systemverilog' };
  }

  // 4. Register Definitions check
  if (
    ext === 'rdl' ||
    ext === 'ralf' ||
    ext === 'h' ||
    ext === 'hpp' ||
    normalizedPath.includes('/regs/') ||
    normalizedPath.includes('/reg/') ||
    normalizedPath.includes('/ral/') ||
    normalizedPath.includes('/csr/') ||
    fileName.includes('_reg') ||
    fileName.includes('register') ||
    ((ext === 'json' || ext === 'csv') && (fileName.includes('reg') || fileName.includes('csr') || fileName.includes('ral') || content.includes('offset')))
  ) {
    const lang = ext === 'h' || ext === 'hpp' ? 'c' : ext === 'json' ? 'json' : ext === 'csv' ? 'csv' : 'systemverilog';
    return { type: 'Registers', language: lang };
  }

  // 5. Testplan check
  if (
    fileName.includes('testplan') ||
    fileName.includes('test_plan') ||
    fileName.includes('vplan') ||
    normalizedPath.includes('/docs/') ||
    normalizedPath.includes('/testplan/') ||
    normalizedPath.includes('/plans/')
  ) {
    const lang = ext === 'md' ? 'markdown' : ext === 'csv' ? 'csv' : 'text';
    return { type: 'Testplan', language: lang };
  }

  // 6. RTL (Verilog, SystemVerilog, VHDL)
  if (
    ['v', 'sv', 'vh', 'svh', 'vhd', 'vhdl'].includes(ext) ||
    normalizedPath.includes('/rtl/') ||
    normalizedPath.includes('/design/') ||
    normalizedPath.includes('/src/') ||
    normalizedPath.includes('/ip/') ||
    normalizedPath.includes('/core/') ||
    (content && (content.includes('module ') || content.includes('endmodule') || content.includes('entity ')))
  ) {
    const lang = ext === 'vhd' || ext === 'vhdl' ? 'vhdl' : 'systemverilog';
    return { type: 'RTL', language: lang };
  }

  // Fallback defaults
  if (ext === 'md') return { type: 'Testplan', language: 'markdown' };
  if (ext === 'h' || ext === 'c') return { type: 'Registers', language: 'c' };
  return { type: 'RTL', language: 'systemverilog' };
}

/**
 * Recursively traverses a FileSystemEntry hierarchy (drag-and-dropped directory)
 * to extract all nested files with relative paths.
 */
export async function scanFileSystemEntry(
  entry: any,
  path = ''
): Promise<{ file: File; relativePath: string }[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file: File) => {
        const fullPath = path ? `${path}/${file.name}` : file.name;
        resolve([{ file, relativePath: fullPath }]);
      }, () => resolve([]));
    });
  } else if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const currentDirPath = path ? `${path}/${entry.name}` : entry.name;
    const entries = await readAllDirectoryEntries(dirReader);
    const nestedPromises = entries.map((childEntry: any) =>
      scanFileSystemEntry(childEntry, currentDirPath)
    );
    const results = await Promise.all(nestedPromises);
    return results.flat();
  }
  return [];
}

/**
 * Helper to exhaustively read all directory entries (handles 100-entry batch limits in webkitGetAsEntry).
 */
async function readAllDirectoryEntries(dirReader: any): Promise<any[]> {
  const allEntries: any[] = [];
  let readBatch = true;
  while (readBatch) {
    const entriesBatch: any[] = await new Promise((resolve) => {
      dirReader.readEntries(
        (entries: any[]) => resolve(entries),
        () => resolve([])
      );
    });
    if (entriesBatch.length === 0) {
      readBatch = false;
    } else {
      allEntries.push(...entriesBatch);
    }
  }
  return allEntries;
}

/**
 * Converts a list of scanned File items into categorized ArtifactFile objects.
 */
export async function processScannedFiles(
  items: { file: File; relativePath: string }[]
): Promise<ArtifactFile[]> {
  const artifacts: ArtifactFile[] = [];

  // Filter out unwanted files like .DS_Store, .git, etc.
  const validItems = items.filter(({ file, relativePath }) => {
    const lower = relativePath.toLowerCase();
    return (
      !lower.includes('.ds_store') &&
      !lower.includes('/.git/') &&
      !lower.startsWith('.git') &&
      !lower.endsWith('.swp') &&
      !lower.endsWith('.bak')
    );
  });

  for (const { file, relativePath } of validItems) {
    const content = await file.text();
    const { type, language } = classifyArtifact(relativePath, content);

    artifacts.push({
      id: `art-upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: relativePath,
      type,
      language,
      content,
    });
  }

  return artifacts;
}
