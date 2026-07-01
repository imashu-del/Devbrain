import React, { useState, useEffect } from "react";
import Head from "next/head";
import ExportCard from "../components/ExportCard";
import { 
  Cpu, 
  Layers, 
  Database, 
  Trash2, 
  RefreshCw, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Code,
  Terminal,
  Server,
  Zap,
  AlertTriangle,
  Globe,
  Compass,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function Home() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'optimize' or 'purge'
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
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
        // Reload timeline if it was purged
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

  const filteredTimeline = timeline.filter(entry => 
    entry.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.snippets.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.diff.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEngineBadge = (modelName, provider) => {
    const modelStr = (modelName || '').toLowerCase();
    
    if (modelStr.includes('nemotron')) {
      return (
        <div className="flex items-center space-x-2 border border-[#00f2fe]/20 bg-[#00f2fe]/5 px-3 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.05)] transition-cinematic">
          <span className="relative flex h-2 w-2">
            {isHarvesting && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#00f2fe] ${isHarvesting ? 'animate-pulse-glow' : ''}`}></span>
          </span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-[#00f2fe]">🤖 NEMOTRON-3-ULTRA</span>
        </div>
      );
    }
    
    if (modelStr.includes('openai') || modelStr.includes('gpt')) {
      return (
        <div className="flex items-center space-x-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-md transition-cinematic">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-emerald-400">⚡ GPT-4o-MINI</span>
        </div>
      );
    }

    // Pure dynamic fallback for any other unexpected model string
    return (
      <div className="flex items-center space-x-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-md transition-cinematic">
        <span className="h-2 w-2 rounded-full bg-slate-500"></span>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-white/70">{(provider || 'CUSTOM').toUpperCase()} / {(modelName || 'DEFAULT').split('/').pop()}</span>
      </div>
    );
  };

  const renderVectorEngine = (provider, dimensions) => {
    const providerStr = (provider || '').toLowerCase();
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-2 border border-white/[0.05] bg-white/[0.01] px-3 py-1.5 rounded-md">
          <span className="h-2 w-2 rounded-full bg-[#00f2fe]"></span>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-white/80">{provider.toUpperCase()} ({dimensions}d Array)</span>
        </div>
        {providerStr === 'fastembed' && (
          <span className="text-[9px] uppercase tracking-widest font-mono text-[#00f2fe] bg-[#00f2fe]/10 border border-[#00f2fe]/20 px-2 py-0.5 rounded">
            ⚡ CPU EDGE ACCELERATED
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050608] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/15 via-black to-black text-slate-100 font-sans selection:bg-[#00f2fe]/30 selection:text-[#00f2fe] transition-cinematic pb-16">
      <Head>
        <title>DevBrain Command Center</title>
        <meta name="description" content="Cinematic Sovereign Persistent Memory Hub" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOP HEADER */}
      <header className="border-b border-white/[0.05] bg-black/40 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/[0.01] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.02)] border border-white/[0.05]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-light tracking-widest text-white uppercase flex items-center gap-2">
                DEVBRAIN COMMAND CENTER
              </h1>
              <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">SOVEREIGN PERSISTENT IDE MEMORY MESH</div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Brain Matrix indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">COGNITIVE CELL:</span>
              {renderEngineBadge(llmModel, providerName)}
            </div>

            {/* Vector Engine Block */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">VECTOR ENGINE:</span>
              {renderVectorEngine(embeddingProvider, embeddingDimensions)}
            </div>

            {/* Engine Mode */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">TOPOLOGY:</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                mode === "cloud" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20"
              }`}>
                {mode === "cloud" ? "CLOUD" : "LOCAL_OSS"}
              </span>
            </div>
          </div>
        </div>
      </header>

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

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT VIEWPORT: PLATFORM ROUTING HUB */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl rounded-2xl p-6 transition-cinematic hover:border-white/[0.08]">
              <div className="mb-6">
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00f2fe]" />
                  <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Platform Routing Hub</span>
                </h2>
                <p className="text-[10px] text-white/40 mt-1">Status channels linking active workflows across editor nodes.</p>
              </div>

              {/* INTEGRATION DECK */}
              <div className="space-y-4">
                {/* Channel 1: STITCH MCP MESH */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-xl flex flex-col gap-2 transition-cinematic hover:bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${
                      stitchProjectId ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent" : "text-white/40"
                    }`}>
                      STITCH MCP MESH
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      stitchProjectId ? "bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse" : "bg-slate-700"
                    }`}></span>
                  </div>
                  <div className="text-[9px] font-mono text-white/30 truncate">
                    {stitchProjectId ? `CONNECTED (DS: ${stitchProjectId})` : "UNBOUND / OFFLINE"}
                  </div>
                </div>

                {/* Channel 2: CURSOR EXTENSION */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-xl flex flex-col gap-2 transition-cinematic hover:bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${
                      cursorActive ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent" : "text-white/40"
                    }`}>
                      CURSOR EXTENSION
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      cursorActive ? "bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse" : "bg-slate-700"
                    }`}></span>
                  </div>
                  <div className="text-[9px] font-mono text-white/30">
                    {cursorActive ? "PORT ENCRYPTED & SYNCING" : "IDLE CHANNEL"}
                  </div>
                </div>

                {/* Channel 3: CLAUDE CODE GATEWAY */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-xl flex flex-col gap-2 transition-cinematic hover:bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${
                      claudeActive ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent" : "text-white/40"
                    }`}>
                      CLAUDE CODE GATEWAY
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      claudeActive ? "bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse" : "bg-slate-700"
                    }`}></span>
                  </div>
                  <div className="text-[9px] font-mono text-white/30">
                    {claudeActive ? "PERSISTED PROMPT PIPELINE READY" : "IDLE CHANNEL"}
                  </div>
                </div>

                {/* Channel 4: LOCAL HARVESTER WATCHER */}
                <div className="p-4 bg-white/[0.01] border border-white/[0.05] rounded-xl flex flex-col gap-2 transition-cinematic hover:bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-mono font-bold ${
                      isHarvesting ? "bg-gradient-to-r from-[#00f2fe] to-[#4facfe] bg-clip-text text-transparent" : "text-white/40"
                    }`}>
                      LOCAL HARVESTER WATCHER
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isHarvesting ? "bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse-glow" : "bg-slate-700"
                    }`}></span>
                  </div>
                  <div className="text-[9px] font-mono text-white/30">
                    {isHarvesting ? "OBSERVING ACTIVE REPO PATHS" : "STANDBY MATRIX"}
                  </div>
                </div>
              </div>
            </div>

            {/* INTEGRATION TIPS */}
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">SOVEREIGN STORAGE MAP</span>
              </h3>
              <p className="text-[10px] leading-relaxed text-white/50">
                Cognitive memories are mapped locally to SQLite (Meta database), LanceDB (Embeddings vector store), and Kuzu (Ontology graph relationships) under absolute paths in your workspace root.
              </p>
            </div>
          </section>

          {/* RIGHT VIEWPORT: COMMAND METRICS & CONTROLS */}
          <section className="lg:col-span-8 flex flex-col gap-8">
            
            {/* CINEMATIC TELEMETRY METRIC CARD HIERARCHY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-cinematic hover:border-white/[0.1]">
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Crawled File System Nodes</div>
                <div className="mt-2 font-extralight tracking-tighter text-6xl text-white">{files.filter(f => f.status === 'synced').length}</div>
                <div className="text-[9px] font-mono text-white/20 mt-2">TOTAL FILES: {files.length}</div>
              </div>
              <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-cinematic hover:border-white/[0.1]">
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Semantic Relationship Edges</div>
                <div className="mt-2 font-extralight tracking-tighter text-6xl text-white">{edges.length}</div>
                <div className="text-[9px] font-mono text-white/20 mt-2">DENSE DUP MAPPING ACTIVE</div>
              </div>
              <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-cinematic hover:border-white/[0.1]">
                <div className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Knowledge Base Vector Nodes</div>
                <div className="mt-2 font-extralight tracking-tighter text-6xl text-white">{nodes.length}</div>
                <div className="text-[9px] font-mono text-white/20 mt-2">EMBEDDED COGNEE ONTOLOGY</div>
              </div>
            </div>

            {/* ACTION CARD MATRIX ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Context Compiler card ( gowing shard ) */}
              <ExportCard />

              {/* Action Matrix & Status details */}
              <div className="flex flex-col gap-6">
                {/* Quick Defrag Action */}
                <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#00f2fe]" />
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Self-Optimize Graph</span>
                    </h3>
                    <p className="text-[10px] text-white/40 mt-1">Prunes duplicate nodes and balances edge weights in the local Kuzu storage engine.</p>
                  </div>
                  <button
                    onClick={() => handleAction("optimize")}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#00f2fe] hover:bg-[#00f2fe]/80 text-[#07080a] font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-cinematic disabled:opacity-50 active:scale-[0.98] shadow-[0_0_15px_rgba(0,242,254,0.1)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === "optimize" ? "animate-spin" : ""}`} />
                    {actionLoading === "optimize" ? "REBALANCING..." : "REBALANCE MEMORY MATRIX"}
                  </button>
                </div>

                {/* Database State and Wipe Details */}
                <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-rose-400 uppercase flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-widest text-rose-400/30 font-semibold">Wipe Sovereign Memories</span>
                    </h3>
                    <p className="text-[10px] text-white/40 mt-1">Surgically resets current graph and vector spaces. This cannot be undone.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to forget all codebase memories? This cannot be undone.")) {
                        handleAction("purge");
                      }
                    }}
                    disabled={actionLoading !== null}
                    className="w-full bg-transparent hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-cinematic disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {actionLoading === "purge" ? "WIPING ENGINE..." : "PURGE ALL DATABASE SEGMENTS"}
                  </button>
                </div>
              </div>
            </div>
            
          </section>
        </div>
      </main>

      {/* MINIMIZED TICKER TRAY ON THE BOTTOM EDGE */}
      <div className={`fixed bottom-0 left-0 right-0 border-t border-white/[0.05] bg-black/90 backdrop-blur-xl transition-cinematic z-40 ${tickerOpen ? 'h-[400px]' : 'h-12'}`}>
        {/* Ticker Header */}
        <div 
          onClick={() => setTickerOpen(!tickerOpen)}
          className="flex justify-between items-center px-6 h-12 cursor-pointer border-b border-white/[0.02] hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00f2fe]" />
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Memory Slices Stream</span>
            <span className="text-[9px] bg-[#00f2fe]/10 text-[#00f2fe] px-2 py-0.5 rounded-full font-mono">
              {timeline.length}
            </span>
          </div>
          <div className="text-[9px] uppercase tracking-wider text-white/40 font-mono">
            {tickerOpen ? "[- Minimize Stream]" : "[+ Expand Stream]"}
          </div>
        </div>
        
        {/* Ticker Content */}
        {tickerOpen && (
          <div className="p-6 h-[350px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Timeline list */}
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-4 border-r border-white/[0.05]">
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
                    <p className="text-[10px] text-white/40 line-clamp-1 mt-1 font-mono">{entry.snippets}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Active Diff Details */}
            <div className="max-h-[300px] overflow-y-auto pr-2">
              {selectedEntry ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold font-mono">
                    DIFF PAYLOAD: {selectedEntry.file}
                  </div>
                  <div className="bg-black/40 border border-white/[0.05] p-3 rounded-lg font-mono text-[9px] max-h-[250px] overflow-auto leading-relaxed">
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
