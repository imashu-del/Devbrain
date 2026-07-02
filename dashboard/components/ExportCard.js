import React, { useState } from "react";
import { FileText, Download, RefreshCw, CheckCircle2, Move, AlertTriangle } from "lucide-react";

export default function ExportCard({ borderless = false }) {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null); // { filePath, content, size }
  const [error, setError] = useState(null);
  const [dragged, setDragged] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const sizeInBytes = data.content ? new Blob([data.content]).size : 0;
        const formattedSize = (sizeInBytes / 1024).toFixed(2) + " KB";
        
        setExportData({
          filePath: data.filePath,
          content: data.content,
          size: formattedSize,
        });
      } else {
        setError(data.error || "Failed to compile knowledge graph.");
      }
    } catch (err) {
      setError("Unable to connect to the compilation server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e) => {
    if (!exportData || !exportData.content) return;
    
    setDragged(true);
    setTimeout(() => setDragged(false), 2000);

    // 1. Text/Plain: Instantly pastes full compiled Markdown context into any text input area (Claude, ChatGPT, etc.)
    e.dataTransfer.setData("text/plain", exportData.content);
    
    // 2. DownloadURL: Enables browser-to-OS file extraction drag & drop (e.g. dragging directly into Cursor workspace, VSCode, or file explorer)
    const downloadUrl = `text/markdown:devbrain_manifest.md:${window.location.origin}${exportData.filePath}`;
    e.dataTransfer.setData("DownloadURL", downloadUrl);
    
    // 3. URI List: Fallback for dropping as a URL link
    e.dataTransfer.setData("text/uri-list", `${window.location.origin}${exportData.filePath}`);
    
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className={`bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6 transition-cinematic flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(0,242,254,0.08)] ${
      borderless ? "border-0" : "border border-white/[0.05] hover:border-white/[0.1]"
    }`}>
      <div>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#00f2fe]" />
          <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Context Compiler</span>
        </h2>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Compile button */}
      {!exportData && (
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-[#00f2fe] hover:bg-[#00f2fe]/80 active:scale-[0.98] disabled:opacity-50 text-[#07080a] font-bold text-xs py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-cinematic shadow-[0_0_15px_rgba(0,242,254,0.1)] hover:shadow-[0_0_25px_rgba(0,242,254,0.2)]"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span className="text-amber-500 font-medium">COMPILING GRAPH CONTEXT...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              EXPORT CONTEXT
            </>
          )}
        </button>
      )}

      {/* Draggable File Card */}
      {exportData && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* File Card UI wrapper (Physical glowing shard style) */}
          <div
            draggable="true"
            onDragStart={handleDragStart}
            className={`group relative p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.06] border border-dashed cursor-grab active:cursor-grabbing transition-cinematic hover:-translate-y-1 flex items-center gap-4 ${
              dragged 
                ? "border-[#00f2fe] bg-[#00f2fe]/5 shadow-[0_0_35px_rgba(0,242,254,0.15)]" 
                : "border-white/[0.05] hover:border-[#00f2fe]/25 hover:shadow-[0_0_35px_rgba(0,242,254,0.08)]"
            }`}
            title="Drag me directly into your AI chat window (Claude, ChatGPT, Cursor, etc.)"
          >
            {/* Visual indicator for drag capability */}
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/40 flex items-center gap-1">
              <span className="text-[9px] font-semibold tracking-wider font-mono">DRAG</span>
              <Move className="w-3 h-3 text-[#00f2fe] animate-pulse" />
            </div>

            {/* File Icon Block */}
            <div className="p-3 bg-[#00f2fe]/10 rounded-lg text-[#00f2fe] border border-[#00f2fe]/20 group-hover:bg-[#00f2fe]/20 group-hover:text-white transition duration-300 shrink-0">
              <FileText className="w-6 h-6" />
            </div>

            {/* Metadata Text */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate font-mono">
                devbrain_manifest.md
              </h4>
              <p className="text-[10px] text-white/40 font-mono mt-0.5">
                Markdown Manifest • {exportData.size}
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-[#00f2fe] bg-[#00f2fe]/10 border border-[#00f2fe]/20 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Compiled & Draggable
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            {/* Download Link */}
            <a
              href={exportData.filePath}
              download="devbrain_manifest.md"
              className="flex-1 text-center bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.98] text-white border border-white/[0.05] font-semibold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-cinematic"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </a>

            {/* Re-compile Option */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-3 bg-white/[0.01] hover:bg-white/[0.06] border border-white/[0.05] text-white/60 hover:text-[#00f2fe] hover:border-[#00f2fe]/30 rounded-lg transition-cinematic active:scale-[0.98]"
              title="Recompile context"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
