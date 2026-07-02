import React, { useState, useEffect } from "react";
import Head from "next/head";
import ExportCard from "../components/ExportCard";
import CentralCoreTelemetry from "../components/CentralCoreTelemetry";
import { DottedGlowBackground } from "../components/ui/dotted-glow-background";
import { 
  Cpu, 
  Layers, 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2
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
    <div className="min-h-screen bg-[#050608] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/15 via-black to-black text-slate-100 font-sans selection:bg-white/20 selection:text-white flex flex-col justify-between items-center relative overflow-hidden transition-cinematic py-10 pb-20">
      
      {/* Interactive canvas-based dotted glow background */}
      <DottedGlowBackground 
        className="absolute inset-0 z-0 pointer-events-none" 
        gap={16} 
        radius={1.2} 
        color="rgba(255, 255, 255, 0.35)" 
        glowColor="rgba(255, 255, 255, 0.85)" 
        opacity={0.8} 
      />

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
          {notification.type === "error" ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
          <span className="text-sm font-medium font-mono">{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER STATUS ROW (Minimalistic) */}
      <header className="w-full max-w-7xl px-8 flex justify-between items-center z-30 transition-cinematic">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wider uppercase font-sans">
          <Cpu className="w-4 h-4 text-white" />
          <span>DEVBRAIN ENGINE COCKPIT</span>
        </div>
      </header>

      {/* CENTRAL CENTERPIECE CONNECTIVITY PORT */}
      <div className="flex-1 flex flex-col justify-center items-center relative my-auto z-10 w-full max-w-3xl gap-3.5">
        
        {/* Radial blur aura pulse glow */}
        {isHarvesting && (
          <div className="absolute w-[360px] h-[360px] rounded-full bg-white/5 blur-3xl pointer-events-none animate-pulse-radial z-0" />
        )}

        <div className="relative z-10">
          <CentralCoreTelemetry isHarvesting={isHarvesting} />
        </div>

        {/* FLOATING ACTION GLASS SHARD (Export project matrix below ring) */}
        <div className="w-[340px] z-20">
          <ExportCard borderless={true} />
        </div>

        {/* COMPACT MATRIX ACTION MATRIX BUTTONS */}
        <div className="flex gap-6 z-20">
          <button
            onClick={() => handleAction("optimize")}
            disabled={actionLoading !== null}
            className="text-[9px] font-sans tracking-wider uppercase text-white/60 hover:text-white transition-cinematic active:scale-95 bg-transparent border-0 cursor-pointer"
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
            className="text-[9px] font-sans tracking-wider uppercase text-rose-500/60 hover:text-rose-400 transition-cinematic active:scale-95 bg-transparent border-0 cursor-pointer"
          >
            {actionLoading === "purge" ? "WIPING MATRIX..." : "WIPE MATRIX"}
          </button>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON FOR CHRONOLOGY STREAM */}
      <button 
        onClick={() => setTickerOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full border border-white/[0.08] bg-slate-950/50 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-cinematic active:scale-95 cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        title="Memory Slices Chronology"
      >
        <Layers className="w-4 h-4 transition-transform group-hover:scale-110" />
        
        {/* Sleek counter badge */}
        {timeline.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#07080a] text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-mono shadow-[0_0_8px_#ffffff]">
            {timeline.length}
          </span>
        )}
      </button>

      {/* FLOATING GLASSMORPHIC MODAL DIALOG */}
      {tickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setTickerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Floating Glassmorphic Window */}
          <div className="relative w-full max-w-4xl bg-slate-950/75 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-6 shadow-[0_20px_50px_rgba(255,255,255,0.06)] flex flex-col gap-4 animate-scaleUp z-10">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white/50" />
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold font-sans">Memory Slices Chronology Stream</span>
                <span className="text-[8px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded font-sans">
                  {timeline.length} TOTAL SLICES
                </span>
              </div>
              <button 
                onClick={() => setTickerOpen(false)}
                className="text-[10px] font-sans tracking-widest uppercase text-white/30 hover:text-white/80 transition-cinematic bg-transparent border-0 cursor-pointer"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              {/* Timeline list */}
              <div className="flex flex-col max-h-full overflow-y-auto pr-4 border-r border-white/[0.05]">
                {timeline.map((entry, idx) => {
                  const isSelected = selectedEntry && selectedEntry.timestamp === entry.timestamp && selectedEntry.file === entry.file;
                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedEntry(entry)}
                      className={`py-2 px-1 border-b border-white/[0.03] last:border-b-0 cursor-pointer transition-cinematic flex flex-col gap-1 ${
                        isSelected 
                          ? "text-white font-semibold" 
                          : "text-white/30 hover:text-white/60"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-2 truncate max-w-[220px]">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-white shadow-[0_0_8px_#ffffff]" : "bg-white/10"}`} />
                          <span className="font-bold truncate">{entry.file}</span>
                        </div>
                        <span className="text-[9px] opacity-60 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[9px] opacity-40 line-clamp-1 font-mono pl-3.5">{entry.snippets}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Active Diff Details */}
              <div className="max-h-full overflow-y-auto pr-2">
                {selectedEntry ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-[9px] uppercase tracking-wider text-white/40 font-semibold font-sans">
                      DIFF PAYLOAD: {selectedEntry.file}
                    </div>
                    <div className="bg-[#030405]/60 border border-white/[0.04] rounded-lg p-4 font-mono text-[10px] max-h-[340px] overflow-auto leading-relaxed">
                      <pre className="text-white/80">
                        {selectedEntry.diff.split("\n").map((line, lIdx) => {
                          let lineClass = "text-white/30";
                          if (line.startsWith("+") && !line.startsWith("+++")) {
                            lineClass = "text-emerald-400/80 bg-emerald-500/[0.04] px-1 py-0.5 rounded";
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

          </div>
        </div>
      )}

    </div>
  );
}
