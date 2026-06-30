import React, { useState } from "react";
import { FileText, Download, RefreshCw, CheckCircle2, Move, AlertTriangle } from "lucide-react";

export default function ExportCard() {
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
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4 transition duration-300 hover:border-slate-800">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Export Project Context
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          Compile active graph memory slice into a Markdown prompt manifest.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Compile button */}
      {!exportData && (
        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/20"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Compiling Graph Context...
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Export Context
            </>
          )}
        </button>
      )}

      {/* Draggable File Card */}
      {exportData && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* File Card UI wrapper */}
          <div
            draggable="true"
            onDragStart={handleDragStart}
            className={`group relative p-4 rounded-xl bg-slate-950/80 border border-dashed cursor-grab active:cursor-grabbing transition-all duration-300 flex items-center gap-4 hover:scale-[1.02] ${
              dragged 
                ? "border-emerald-400/80 bg-emerald-950/10 shadow-lg shadow-emerald-950/30" 
                : "border-slate-800 hover:border-emerald-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-slate-950/50"
            }`}
            title="Drag me directly into your AI chat window (Claude, ChatGPT, Cursor, etc.)"
          >
            {/* Visual indicator for drag capability */}
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-500 flex items-center gap-1">
              <span className="text-[9px] font-semibold tracking-wider font-mono">DRAG</span>
              <Move className="w-3 h-3 animate-pulse" />
            </div>

            {/* File Icon Block */}
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition duration-300 shrink-0">
              <FileText className="w-6 h-6" />
            </div>

            {/* Metadata Text */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-200 truncate font-mono">
                devbrain_manifest.md
              </h4>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Markdown Manifest • {exportData.size}
              </p>
              <div className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
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
              className="flex-1 text-center bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 border border-slate-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </a>

            {/* Re-compile Option */}
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition active:scale-[0.98]"
              title="Recompile context"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
