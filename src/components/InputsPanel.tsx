import React, { useState, useRef } from 'react';
import {
  FileCode,
  Upload,
  Plus,
  Trash2,
  FileText,
  FileCheck,
  CheckCircle,
  X,
  Code,
  Layers,
  Sparkles,
  FolderUp,
  Folder,
  Search,
  Filter,
  Check,
  AlertCircle,
  ArrowDownToLine,
} from 'lucide-react';
import { ArtifactFile } from '../data/demoData';
import { ArtifactType } from '../types/specDelta';
import {
  classifyArtifact,
  scanFileSystemEntry,
  processScannedFiles,
} from '../utils/artifactClassifier';

interface InputsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  specV1: string;
  setSpecV1: (val: string) => void;
  specV2: string;
  setSpecV2: (val: string) => void;
  artifacts: ArtifactFile[];
  setArtifacts: React.Dispatch<React.SetStateAction<ArtifactFile[]>>;
  onLoadDemo: () => void;
  onOpenPresets?: () => void;
  currentIpName?: string;
}

export const InputsPanel: React.FC<InputsPanelProps> = ({
  isOpen,
  onClose,
  specV1,
  setSpecV1,
  specV2,
  setSpecV2,
  artifacts,
  setArtifacts,
  onLoadDemo,
  onOpenPresets,
  currentIpName = 'AXI_UART_DMA_IP',
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'artifacts'>('artifacts');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    artifacts[0]?.id || ''
  );

  // New file modal / inline state
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<ArtifactType>('RTL');
  const [isAddingArtifact, setIsAddingArtifact] = useState(false);

  // Drag and Drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    total: number;
    byType: Record<string, number>;
  } | null>(null);

  // Filter & Search
  const [artifactSearch, setArtifactSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Input refs
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentArtifact =
    artifacts.find((a) => a.id === selectedArtifactId) || artifacts[0];

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only toggle if leaving the actual container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsProcessingUpload(true);
    try {
      const scannedItems: { file: File; relativePath: string }[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry?.();
          if (entry) {
            const results = await scanFileSystemEntry(entry);
            scannedItems.push(...results);
          } else {
            const file = item.getAsFile();
            if (file) {
              scannedItems.push({ file, relativePath: file.name });
            }
          }
        }
      }

      if (scannedItems.length > 0) {
        const parsedArtifacts = await processScannedFiles(scannedItems);
        if (parsedArtifacts.length > 0) {
          // Merge with existing artifacts, updating by name if already exists
          setArtifacts((prev) => {
            const existingMap = new Map(prev.map((a) => [a.name, a]));
            parsedArtifacts.forEach((a) => existingMap.set(a.name, a));
            return Array.from(existingMap.values());
          });

          setSelectedArtifactId(parsedArtifacts[0].id);

          // Calculate feedback breakdown
          const breakdown: Record<string, number> = {};
          parsedArtifacts.forEach((a) => {
            breakdown[a.type] = (breakdown[a.type] || 0) + 1;
          });
          setUploadFeedback({ total: parsedArtifacts.length, byType: breakdown });
          setTimeout(() => setUploadFeedback(null), 6000);
        }
      }
    } catch (err) {
      console.error('Directory drop error:', err);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Folder Upload via Input
  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessingUpload(true);
    try {
      const scannedItems: { file: File; relativePath: string }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        // webkitRelativePath contains the full relative path from the selected directory
        const relativePath = (file as any).webkitRelativePath || file.name;
        scannedItems.push({ file, relativePath });
      }

      const parsedArtifacts = await processScannedFiles(scannedItems);
      if (parsedArtifacts.length > 0) {
        setArtifacts((prev) => {
          const existingMap = new Map(prev.map((a) => [a.name, a]));
          parsedArtifacts.forEach((a) => existingMap.set(a.name, a));
          return Array.from(existingMap.values());
        });

        setSelectedArtifactId(parsedArtifacts[0].id);

        const breakdown: Record<string, number> = {};
        parsedArtifacts.forEach((a) => {
          breakdown[a.type] = (breakdown[a.type] || 0) + 1;
        });
        setUploadFeedback({ total: parsedArtifacts.length, byType: breakdown });
        setTimeout(() => setUploadFeedback(null), 6000);
      }
    } catch (err) {
      console.error('Directory input error:', err);
    } finally {
      setIsProcessingUpload(false);
      e.target.value = '';
    }
  };

  // Multiple Files Upload
  const handleMultipleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessingUpload(true);
    try {
      const scannedItems: { file: File; relativePath: string }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        scannedItems.push({ file, relativePath: file.name });
      }

      const parsedArtifacts = await processScannedFiles(scannedItems);
      if (parsedArtifacts.length > 0) {
        setArtifacts((prev) => [...prev, ...parsedArtifacts]);
        setSelectedArtifactId(parsedArtifacts[0].id);

        const breakdown: Record<string, number> = {};
        parsedArtifacts.forEach((a) => {
          breakdown[a.type] = (breakdown[a.type] || 0) + 1;
        });
        setUploadFeedback({ total: parsedArtifacts.length, byType: breakdown });
        setTimeout(() => setUploadFeedback(null), 6000);
      }
    } finally {
      setIsProcessingUpload(false);
      e.target.value = '';
    }
  };

  const handleSpecUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'specV1' | 'specV2'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === 'specV1') setSpecV1(content);
      else if (target === 'specV2') setSpecV2(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCustomArtifact = () => {
    if (!newFileName.trim()) return;
    const { type, language } = classifyArtifact(newFileName.trim());
    const finalType = newFileType || type;
    const newArt: ArtifactFile = {
      id: `art-${Date.now()}`,
      name: newFileName.trim(),
      type: finalType,
      language,
      content: `// Source file: ${newFileName.trim()}\n// Artifact type: ${finalType}\n`,
    };
    setArtifacts((prev) => [...prev, newArt]);
    setSelectedArtifactId(newArt.id);
    setNewFileName('');
    setIsAddingArtifact(false);
  };

  const handleDeleteArtifact = (id: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
    if (selectedArtifactId === id) {
      const remaining = artifacts.filter((a) => a.id !== id);
      setSelectedArtifactId(remaining[0]?.id || '');
    }
  };

  const handleUpdateCurrentContent = (text: string) => {
    if (!currentArtifact) return;
    setArtifacts((prev) =>
      prev.map((a) => (a.id === currentArtifact.id ? { ...a, content: text } : a))
    );
  };

  // Filtered artifacts
  const filteredArtifacts = artifacts.filter((art) => {
    const matchesSearch =
      art.name.toLowerCase().includes(artifactSearch.toLowerCase()) ||
      art.type.toLowerCase().includes(artifactSearch.toLowerCase());
    const matchesType =
      typeFilter === 'all' || art.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const typeBadgeColor: Record<string, string> = {
    RTL: 'bg-purple-950 text-purple-300 border-purple-800',
    Registers: 'bg-blue-950 text-blue-300 border-blue-800',
    'UVM/TB': 'bg-cyan-950 text-cyan-300 border-cyan-800',
    Assertions: 'bg-amber-950 text-amber-300 border-amber-800',
    Coverage: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    Testplan: 'bg-rose-950 text-rose-300 border-rose-800',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Full-Screen Drag-and-Drop Active Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 bg-cyan-950/90 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none backdrop-blur-sm animate-in fade-in duration-100">
            <div className="w-16 h-16 rounded-2xl bg-cyan-900/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-900/50 mb-3 animate-bounce">
              <FolderUp className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-mono">
              Drop Directory or Files to Parse
            </h3>
            <p className="text-xs text-cyan-200 mt-1 max-w-md text-center">
              Releases files will be scanned recursively and categorized automatically (RTL, UVM/TB, Assertions, Registers, Coverage, Testplans).
            </p>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Hardware Specifications & Downstream Design Artifacts</span>
                <span className="text-xs font-normal text-zinc-400 px-2 py-0.5 rounded bg-zinc-800 font-mono">
                  {artifacts.length} files loaded
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Input Spec v1 & v2 revisions plus downstream RTL, registers, SVA assertions, UVM testbench, and test plans
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenPresets && (
              <button
                onClick={onOpenPresets}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-800/80 flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Switch IP Spec ({currentIpName})</span>
              </button>
            )}
            <button
              onClick={onLoadDemo}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset IP</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Tab Bar: Specs vs Artifacts */}
        <div className="px-6 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex space-x-2 py-2">
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-zinc-800 text-cyan-300 shadow border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Specification Revisions (v1 & v2)</span>
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all cursor-pointer ${
                activeTab === 'artifacts'
                  ? 'bg-zinc-800 text-cyan-300 shadow border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>2. Downstream Artifacts ({artifacts.length})</span>
            </button>
          </div>

          {/* Quick upload directory trigger from top bar */}
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => folderInputRef.current?.click()}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 flex items-center space-x-1 cursor-pointer"
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>Upload Folder...</span>
            </button>
          </div>
        </div>

        {/* Upload Feedback Toast */}
        {uploadFeedback && (
          <div className="px-6 py-2.5 bg-emerald-950/70 border-b border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Parsed & Categorized {uploadFeedback.total} files:</strong>{' '}
                {Object.entries(uploadFeedback.byType)
                  .map(([type, count]) => `${count} ${type}`)
                  .join(', ')}
              </span>
            </div>
            <button
              onClick={() => setUploadFeedback(null)}
              className="text-emerald-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'specs' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Spec v1 */}
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">SPEC V1.0 (Baseline)</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {specV1.length.toLocaleString()} chars
                    </span>
                  </div>
                  <label className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Upload V1 (.pdf/.docx/.txt/.md)</span>
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => handleSpecUpload(e, 'specV1')}
                    />
                  </label>
                </div>
                <textarea
                  value={specV1}
                  onChange={(e) => setSpecV1(e.target.value)}
                  placeholder="Paste baseline Spec v1 markdown or engineering text here..."
                  className="flex-1 min-h-[380px] p-4 bg-transparent text-zinc-300 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                />
              </div>

              {/* Spec v2 */}
              <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-zinc-200 font-mono">SPEC V2.0 (New Revision)</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {specV2.length.toLocaleString()} chars
                    </span>
                  </div>
                  <label className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Upload V2 (.pdf/.docx/.txt/.md)</span>
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => handleSpecUpload(e, 'specV2')}
                    />
                  </label>
                </div>
                <textarea
                  value={specV2}
                  onChange={(e) => setSpecV2(e.target.value)}
                  placeholder="Paste revised Spec v2 text with updated hardware clauses..."
                  className="flex-1 min-h-[380px] p-4 bg-transparent text-zinc-300 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Downstream Artifacts Tab */
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[480px]">
              {/* Left sidebar: File Tree & Uploader */}
              <div className="w-full lg:w-80 bg-zinc-950 rounded-xl border border-zinc-800 p-3 flex flex-col shrink-0">
                {/* Upload Action Row */}
                <div className="pb-3 border-b border-zinc-800 space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Artifacts ({filteredArtifacts.length})
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {/* Hidden Folder Input */}
                      <input
                        type="file"
                        ref={folderInputRef}
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        multiple
                        className="hidden"
                        onChange={handleDirectorySelect}
                      />
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        title="Upload entire directory of RTL, TB, SVA, or regs"
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <FolderUp className="w-3 h-3" />
                        <span>Upload Dir</span>
                      </button>

                      {/* Hidden Multi-file input */}
                      <input
                        type="file"
                        ref={filesInputRef}
                        multiple
                        className="hidden"
                        onChange={handleMultipleFilesSelect}
                      />
                      <button
                        onClick={() => filesInputRef.current?.click()}
                        title="Upload individual files"
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Files</span>
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop Dropzone Banner */}
                  <div
                    onClick={() => folderInputRef.current?.click()}
                    className="p-3 rounded-lg border border-dashed border-zinc-700/80 hover:border-cyan-500/80 bg-zinc-900/40 hover:bg-cyan-950/20 text-center cursor-pointer transition-colors group"
                  >
                    <FolderUp className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 mx-auto mb-1 transition-colors" />
                    <p className="text-[11px] font-medium text-zinc-300 group-hover:text-cyan-300">
                      Drag & Drop Directory Here
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Auto-detects RTL, TB, Assertions, Registers & Coverage
                    </p>
                  </div>

                  {/* Search and Type Filter */}
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={artifactSearch}
                        onChange={(e) => setArtifactSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px] font-mono">
                      {['all', 'RTL', 'Registers', 'Assertions', 'UVM/TB', 'Coverage', 'Testplan'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`px-1.5 py-0.5 rounded transition-colors shrink-0 cursor-pointer ${
                            typeFilter === t
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File list */}
                <div className="space-y-1 overflow-y-auto flex-1 max-h-[300px]">
                  {filteredArtifacts.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">
                      No files match current filter.
                    </div>
                  ) : (
                    filteredArtifacts.map((art) => {
                      const isSelected = art.id === selectedArtifactId;

                      return (
                        <div
                          key={art.id}
                          onClick={() => setSelectedArtifactId(art.id)}
                          className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className="w-3.5 h-3.5 shrink-0 text-zinc-500 group-hover:text-cyan-400" />
                            <span className="truncate font-mono">{art.name}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                                typeBadgeColor[art.type] || 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {art.type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArtifact(art.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 cursor-pointer transition-opacity"
                              title="Delete artifact"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add new file section */}
                <div className="pt-3 border-t border-zinc-800 mt-2">
                  {isAddingArtifact ? (
                    <div className="space-y-2 p-2 bg-zinc-900 rounded-lg border border-zinc-700">
                      <input
                        type="text"
                        placeholder="e.g. rtl/dma_engine.sv"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        className="w-full text-xs p-1.5 bg-zinc-950 text-zinc-200 rounded border border-zinc-700 focus:outline-none font-mono"
                      />
                      <select
                        value={newFileType}
                        onChange={(e) => setNewFileType(e.target.value as ArtifactType)}
                        className="w-full text-xs p-1.5 bg-zinc-950 text-zinc-200 rounded border border-zinc-700 focus:outline-none font-mono"
                      >
                        <option value="RTL">RTL (.v/.sv)</option>
                        <option value="Registers">Registers (.h/.json/.csv/.rdl)</option>
                        <option value="UVM/TB">UVM/TB (.sv)</option>
                        <option value="Assertions">Assertions (.sv/.sva)</option>
                        <option value="Coverage">Coverage (.sv/.cfg)</option>
                        <option value="Testplan">Testplan (.md/.csv)</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddCustomArtifact}
                          className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                        >
                          Add File
                        </button>
                        <button
                          onClick={() => setIsAddingArtifact(false)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingArtifact(true)}
                      className="w-full py-1.5 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500 text-zinc-400 hover:text-cyan-400 text-xs flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Blank File</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Code/Content Editor for Selected Artifact */}
              <div className="flex-1 flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                {currentArtifact ? (
                  <>
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCode className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-zinc-200 font-mono">
                          {currentArtifact.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                            typeBadgeColor[currentArtifact.type] || 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {currentArtifact.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {currentArtifact.content.split('\n').length} lines
                      </span>
                    </div>
                    <textarea
                      value={currentArtifact.content}
                      onChange={(e) => handleUpdateCurrentContent(e.target.value)}
                      placeholder="Paste artifact source code here..."
                      className="flex-1 min-h-[380px] p-4 bg-transparent text-zinc-300 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                    No artifact selected. Drag and drop a folder or add a file from the list.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Tip: Drag & drop your local project repository directly into this window to scan all downstream files.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
