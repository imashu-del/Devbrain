import React, { useState, useEffect } from "react";
import Head from "next/head";
import ExportCard from "../components/ExportCard";
import { 
  Cpu, 
  Layers, 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Globe,
  Compass
} from "lucide-react";

export default function Home() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'optimize' or 'purge'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [mode, setMode] = useState("local");
  const [providerName, setProviderName] = useState("nemotron");
  
  // Dynamic metrics hooks
  const [llmModel, setLlmModel] = useState("");
  const [embeddingProvider, setEmbeddingProvider] = useState("");
  const [embeddingDimensions, setEmbeddingDimensions] = useState(0);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [files, setFiles] = useState([]);
  
  // Mesh Integration states
  const [stitchProjectId, setStitchProjectId] = useState("");
  const [cursorActive, setCursorActive] = useState(false);
  const [claudeActive, setClaudeActive] = useState(false);
  
  // Ticker Drawer State
  const [tickerOpen, setTickerOpen] = useState(false);

  // Fetch timeline data from local Cognee memory API
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setTimeline(data.entries || []);
      setMode(data.mode || "local");
      setProviderName(data.provider || "nemotron");
      
      // Map rich database statistics
      setLlmModel(data.llmModel || "");
      setEmbeddingProvider(data.embedding_provider || "");
      setEmbeddingDimensions(data.embedding_dimensions || 0);
      setIsHarvesting(data.isHarvesting || false);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setFiles(data.files || []);
      
      // Mesh integrations
      setStitchProjectId(data.stitchProjectId || "");
      setCursorActive(data.cursorActive || false);
      setClaudeActive(data.claudeActive || false);
      
      if (data.entries && data.entries.length > 0) {
        setSelectedEntry(data.entries[0]);
      }
    } catch (err) {
      showToast("Error loading timeline context from Cognee store.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const [notification, setNotification] = useState(null);
  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAction = async (actionType) => {
    setActionLoading(actionType);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Operation completed successfully.", "success");
        if (actionType === "purge") {
          fetchTimeline();
        }
      } else {
        showToast(data.error || "Operation failed.", "error");
      }
    } catch (err) {
      showToast("Could not contact the local API backend.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/15 via-black to-black text-slate-100 font-sans selection:bg-[#00f2fe]/30 selection:text-[#00f2fe] flex flex-col justify-between items-center relative overflow-hidden transition-cinematic py-10 pb-20">
      <Head>
        <title>DevBrain Command Center</title>
        <meta name="description" content="Cinematic Sovereign Persistent Memory Hub" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-16 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-cinematic ${
          notification.type === "error" 
            ? "bg-rose-950/80 border-rose-500/30 text-rose-200" 
            : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"
        }`}>
          {notification.type === "error" ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-[#00f2fe]" />}
          <span className="text-sm font-medium font-mono">{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER STATUS ROW (Minimalistic) */}
      <header className="w-full max-w-7xl px-8 flex justify-between items-center text-[10px] uppercase tracking-widest text-white/30 font-semibold font-mono z-30">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-white/60" />
          <span>DEVBRAIN FLIGHT DECK v0.2.0</span>
        </div>
        <div className="flex items-center gap-6">
          <span>TOPOLOGY: {mode === "cloud" ? "CLOUD" : "LOCAL_OSS"}</span>
          <span>MODEL: {llmModel.split('/').pop() || 'CUSTOM'}</span>
        </div>
      </header>

      {/* CENTRAL CENTERPIECE CONNECTIVITY PORT */}
      <div className="flex-1 flex flex-col justify-center items-center relative my-auto z-10 w-full max-w-3xl">
        <div className="relative w-[480px] h-[480px] flex items-center justify-center">
          
          {/* Radial blur aura pulse glow */}
          {isHarvesting && (
            <div className="absolute w-[360px] h-[360px] rounded-full bg-[#00f2fe]/5 blur-3xl pointer-events-none animate-pulse-radial" />
          )}

          {/* THE CENTRAL CONNECTIVITY RING */}
          <div className={`w-72 h-72 rounded-full border border-white/[0.05] bg-black/60 backdrop-blur-2xl flex flex-col justify-center items-center relative z-10 transition-cinematic ${
            isHarvesting ? "animate-pulse-radial border-[#00f2fe]/30 shadow-[0_0_50px_rgba(0,242,254,0.08)]" : "shadow-[0_0_30px_rgba(255,255,255,0.01)]"
          }`}>
            <Cpu className={`w-8 h-8 mb-4 transition-cinematic ${isHarvesting ? "text-[#00f2fe] animate-pulse" : "text-white/20"}`} />
            
            <div className="text-center px-6">
              {/* Force "Active Tracking Enabled" per user requested selection */}
              <div className="text-[10px] uppercase tracking-widest text-[#00f2fe] font-bold">
                Active Tracking Enabled
              </div>
              <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono mt-2">
                {isHarvesting ? "HARVESTER ACTIVE" : "STANDBY SYSTEM"} // {embeddingDimensions || 384}d NEURAL GRAPH
              </div>
            </div>
          </div>

          {/* ECOSYSTEM CONNECTION POINTS */}
          
          {/* Node 1: STITCH MCP (Left Branch) */}
          <div className="absolute left-2 flex items-center gap-3 z-20">
            <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-widest uppercase transition-cinematic ${
              stitchProjectId 
                ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent border-[#00f2fe]/20 shadow-[0_0_20px_rgba(0,242,254,0.06)]" 
                : "bg-white/[0.01] border-white/[0.03] text-white/20"
            }`}>
              STITCH MCP
            </div>
            <div className={`w-10 h-px transition-cinematic ${stitchProjectId ? "bg-[#00f2fe]/30" : "bg-white/[0.05]"}`} />
          </div>

          {/* Node 2: CURSOR IDE (Top Right Branch) */}
          <div className="absolute -top-2 right-12 flex flex-col items-center gap-2 z-20">
            <div className={`w-px h-10 transition-cinematic ${cursorActive ? "bg-[#00f2fe]/30" : "bg-white/[0.05]"}`} />
            <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-widest uppercase transition-cinematic ${
              cursorActive 
                ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent border-[#00f2fe]/20 shadow-[0_0_20px_rgba(0,242,254,0.06)]" 
                : "bg-white/[0.01] border-white/[0.03] text-white/20"
            }`}>
              CURSOR IDE
            </div>
          </div>

          {/* Node 3: CLAUDE CODE (Bottom Right Branch) */}
          <div className="absolute -bottom-2 right-12 flex flex-col items-center gap-2 z-20">
            <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-widest uppercase transition-cinematic ${
              claudeActive 
                ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent border-[#00f2fe]/20 shadow-[0_0_20px_rgba(0,242,254,0.06)]" 
                : "bg-white/[0.01] border-white/[0.03] text-white/20"
            }`}>
              CLAUDE CODE
            </div>
            <div className={`w-px h-10 transition-cinematic ${claudeActive ? "bg-[#00f2fe]/30" : "bg-white/[0.05]"}`} />
          </div>

          {/* Node 4: LOCAL WATCHER (Right Center Branch) */}
          <div className="absolute right-2 flex items-center gap-3 z-20">
            <div className={`w-10 h-px transition-cinematic ${isHarvesting ? "bg-[#00f2fe]/30" : "bg-white/[0.05]"}`} />
            <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-mono tracking-widest uppercase transition-cinematic ${
              isHarvesting 
                ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent border-[#00f2fe]/20 shadow-[0_0_20px_rgba(0,242,254,0.06)]" 
                : "bg-white/[0.01] border-white/[0.03] text-white/20"
            }`}>
              LOCAL WATCHER
            </div>
          </div>

        </div>

        {/* FLOATING ACTION GLASS SHARD (Export project matrix below ring) */}
        <div className="mt-2 w-[340px] z-20">
          <ExportCard borderless={true} />
        </div>

        {/* COMPACT MATRIX ACTION MATRIX BUTTONS */}
        <div className="flex gap-4 mt-8 z-20">
          <button
            onClick={() => handleAction("optimize")}
            disabled={actionLoading !== null}
            className="px-4 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] text-[9px] font-mono tracking-wider uppercase text-white/50 hover:text-white transition-cinematic active:scale-95"
          >
            {actionLoading === "optimize" ? "REBALANCING..." : "REBALANCE GRAPH"}
          </button>
          <button
            onClick={() => {
              if (confirm("Reset current codebase memories?")) {
                handleAction("purge");
              }
            }}
            disabled={actionLoading !== null}
            className="px-4 py-1.5 rounded-full border border-rose-500/10 bg-transparent hover:bg-rose-950/10 text-[9px] font-mono tracking-wider uppercase text-rose-400/60 hover:text-rose-400 transition-cinematic active:scale-95"
          >
            {actionLoading === "purge" ? "WIPING MATRIX..." : "WIPE MATRIX"}
          </button>
        </div>
      </div>

      {/* RAZOR-THIN STATUS METADATA TICKER BAR (At the bottom) */}
      <footer className="w-full max-w-7xl px-8 flex justify-between items-center text-[9px] uppercase tracking-widest text-white/30 font-semibold font-mono z-30">
        <div>KNOWLEDGE BASE ENGINE • VERTICES: {nodes.length} • ENCLOSURES: {edges.length} • DIRECTORY NODES: {files.length}</div>
        <button 
          onClick={fetchTimeline}
          className="hover:text-white transition-cinematic"
        >
          [ REFRESH TELEMETRY ]
        </button>
      </footer>

      {/* TICKER DRAWER ON THE BOTTOM EDGE */}
      <div className={`fixed bottom-0 left-0 right-0 border-t border-white/[0.05] bg-[#050608]/95 backdrop-blur-2xl transition-cinematic z-40 ${tickerOpen ? 'h-[360px]' : 'h-8'}`}>
        {/* Ticker Header */}
        <div 
          onClick={() => setTickerOpen(!tickerOpen)}
          className="flex justify-between items-center px-6 h-8 cursor-pointer border-b border-white/[0.02] hover:bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-[#00f2fe]" />
            <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Memory Slices Chronology Stream</span>
            <span className="text-[8px] bg-[#00f2fe]/10 text-[#00f2fe] px-1.5 py-0.5 rounded font-mono">
              {timeline.length}
            </span>
          </div>
          <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono">
            {tickerOpen ? "[- Collapse]" : "[+ Expand]"}
          </div>
        </div>
        
        {/* Ticker Content */}
        {tickerOpen && (
          <div className="p-6 h-[328px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Timeline list */}
            <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-4 border-r border-white/[0.05]">
              {timeline.map((entry, idx) => {
                const isSelected = selectedEntry && selectedEntry.timestamp === entry.timestamp && selectedEntry.file === entry.file;
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 rounded-lg border cursor-pointer transition-cinematic ${
                      isSelected 
                        ? "bg-white/[0.04] border-[#00f2fe]/20 text-[#00f2fe]" 
                        : "bg-white/[0.01] border-white/[0.03] text-white/60 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold truncate max-w-[200px]">{entry.file}</span>
                      <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[9px] text-white/40 line-clamp-1 mt-1 font-mono">{entry.snippets}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Active Diff Details */}
            <div className="max-h-[280px] overflow-y-auto pr-2">
              {selectedEntry ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[9px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    DIFF PAYLOAD: {selectedEntry.file}
                  </div>
                  <div className="bg-black/40 border border-white/[0.05] p-3 rounded-lg font-mono text-[9px] max-h-[230px] overflow-auto leading-relaxed">
                    <pre className="text-white/80">
                      {selectedEntry.diff.split("\n").map((line, lIdx) => {
                        let lineClass = "text-white/30";
                        if (line.startsWith("+") && !line.startsWith("+++")) {
                          lineClass = "text-[#00f2fe] bg-[#00f2fe]/5 px-1 py-0.5 rounded";
                        } else if (line.startsWith("-") && !line.startsWith("---")) {
                          lineClass = "text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded";
                        } else if (line.startsWith("@@")) {
                          lineClass = "text-amber-500/80 font-bold";
                        }
                        return (
                          <div key={lIdx} className={lineClass}>
                            {line}
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-white/30">
                  Select a slice to inspect git payload
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
