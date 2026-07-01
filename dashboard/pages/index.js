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
  AlertTriangle
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
  
  // New metrics hooks
  const [llmModel, setLlmModel] = useState("");
  const [embeddingProvider, setEmbeddingProvider] = useState("");
  const [embeddingDimensions, setEmbeddingDimensions] = useState(0);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [files, setFiles] = useState([]);

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
        <div className="flex items-center space-x-2 border border-[#00f2fe]/20 bg-[#00f2fe]/5 px-3 py-1.5 rounded-md backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.05)]">
          <span className="relative flex h-2 w-2">
            {isHarvesting && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#00f2fe] ${isHarvesting ? 'animate-pulse-glow' : ''}`}></span>
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#00f2fe]">🤖 NEMOTRON-3-ULTRA</span>
        </div>
      );
    }
    
    if (modelStr.includes('openai') || modelStr.includes('gpt')) {
      return (
        <div className="flex items-center space-x-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-md">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">⚡ GPT-4o-MINI</span>
        </div>
      );
    }

    // Pure dynamic fallback for any other unexpected model string
    return (
      <div className="flex items-center space-x-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-md">
        <span className="h-2 w-2 rounded-full bg-slate-400"></span>
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">{(provider || 'CUSTOM').toUpperCase()} / {modelName.split('/').pop()}</span>
      </div>
    );
  };

  const renderVectorEngine = (provider, dimensions) => {
    const providerStr = (provider || '').toLowerCase();
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-2 border border-white/[0.05] bg-white/[0.01] px-3 py-1.5 rounded-md">
          <span className="h-2 w-2 rounded-full bg-[#00f2fe]"></span>
          <span className="text-xs uppercase tracking-wider font-semibold text-white/80">{provider.toUpperCase()} ({dimensions}d Array)</span>
        </div>
        {providerStr === 'fastembed' && (
          <span className="text-[10px] uppercase tracking-wider font-semibold font-mono text-[#00f2fe] bg-[#00f2fe]/10 border border-[#00f2fe]/20 px-2 py-1 rounded">
            ⚡ CPU EDGE ACCELERATED
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-[#00f2fe]/30 selection:text-[#00f2fe]">
      <Head>
        <title>DevBrain Cockpit - Cognee local-first memory</title>
        <meta name="description" content="Persistent Memory Layer for Software Development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOP HEADER */}
      <header className="border-b border-white/[0.05] bg-[#07080a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-[#00f2fe] to-slate-900 rounded-xl shadow-[0_0_15px_rgba(0,242,254,0.15)] border border-[#00f2fe]/30">
              <Cpu className="w-6 h-6 text-[#00f2fe]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DevBrain Cockpit
              </h1>
              <div className="tracking-wider text-xs uppercase font-semibold text-white/40">Sovereign Context Telemetry</div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Brain Matrix telemetry indicator block */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/[0.05] bg-white/[0.01]">
              <span className="tracking-wider text-[10px] uppercase font-semibold text-white/40">Cognitive Layer:</span>
              {renderEngineBadge(llmModel, providerName)}
            </div>

            {/* Vector Engine Block */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/[0.05] bg-white/[0.01]">
              <span className="tracking-wider text-[10px] uppercase font-semibold text-white/40">Vector Engine:</span>
              {renderVectorEngine(embeddingProvider, embeddingDimensions)}
            </div>

            {/* Engine Mode telemetry indicator block */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/[0.05] bg-white/[0.01]">
              <span className="tracking-wider text-[10px] uppercase font-semibold text-white/40">Topology:</span>
              <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded ${
                mode === "cloud" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {mode === "cloud" ? "☁️ COGNEE_CLOUD" : "💻 LOCAL_OSS"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${
          notification.type === "error" 
            ? "bg-rose-950/80 border-rose-500/30 text-rose-200" 
            : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"
        }`}>
          {notification.type === "error" ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* METRIC GRID */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-all duration-300 hover:border-white/[0.1]">
            <div className="tracking-wider text-xs uppercase font-semibold text-white/40">Crawled Files Index</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">
              {files.filter(f => f.status === 'synced').length} <span className="text-xs text-white/30">/ {files.length}</span>
            </div>
          </div>
          <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-all duration-300 hover:border-white/[0.1]">
            <div className="tracking-wider text-xs uppercase font-semibold text-white/40">Relationship Edges</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">{edges.length}</div>
          </div>
          <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-xl p-6 transition-all duration-300 hover:border-white/[0.1]">
            <div className="tracking-wider text-xs uppercase font-semibold text-white/40">Knowledge Base Vector Nodes</div>
            <div className="mt-2 text-3xl font-light tracking-tight text-white">{nodes.length}</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: TIMELINE */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    <Layers className="w-5 h-5 text-[#00f2fe]" />
                    <span className="tracking-wider text-xs uppercase font-semibold text-white/40">Memory Slices Chronology</span>
                  </h2>
                  <p className="text-[11px] text-white/40 mt-1">Real-time repository updates & design context records</p>
                </div>
                <button 
                  onClick={fetchTimeline}
                  className="p-2 bg-white/[0.02] hover:bg-white/[0.08] active:scale-95 text-white/80 hover:text-white rounded-lg border border-white/[0.05] transition"
                  title="Refresh Timeline"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#00f2fe]" : ""}`} />
                </button>
              </div>

              {/* SEARCH FILTER */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Filter harvested code modifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/[0.05] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00f2fe]/40 focus:ring-1 focus:ring-[#00f2fe]/40 transition placeholder:text-white/20"
                />
              </div>

              {/* TIMELINE LIST */}
              {loading ? (
                <div className="py-20 text-center text-white/40 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#00f2fe]" />
                  <div className="tracking-wider text-xs uppercase font-semibold text-white/40">Reading Memory Slices...</div>
                </div>
              ) : filteredTimeline.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-white/[0.05] rounded-xl">
                  <FileText className="w-10 h-10 mx-auto text-white/20 mb-3" />
                  <p className="text-white/50 font-medium">No memory segments found matching the criteria.</p>
                  <p className="text-xs text-white/30 mt-1">Make changes in your code or run tests to populate the graph.</p>
                </div>
              ) : (
                <div className="relative border-l border-white/[0.05] pl-6 ml-3 flex flex-col gap-6">
                  {filteredTimeline.map((entry, idx) => {
                    const isSelected = selectedEntry && selectedEntry.timestamp === entry.timestamp && selectedEntry.file === entry.file;
                    return (
                      <div 
                        key={idx}
                        className={`relative group cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
                          isSelected 
                            ? "bg-white/[0.03] border-[#00f2fe]/30 shadow-[0_0_15px_rgba(0,242,254,0.05)]" 
                            : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]"
                        }`}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {/* Bullet Icon */}
                        <div className={`absolute -left-[31px] top-4.5 w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                          isSelected 
                            ? "bg-[#00f2fe] border-[#00f2fe] shadow-[0_0_8px_#00f2fe]" 
                            : "bg-[#07080a] border-white/20 group-hover:border-[#00f2fe]"
                        }`}></div>

                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-sm font-bold text-white group-hover:text-[#00f2fe] transition flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5 text-white/30" />
                            {entry.file}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/[0.02]">
                          {entry.snippets}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* EXPANDED ACTIVE DIFF PANEL */}
            {selectedEntry && (
              <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#00f2fe]" />
                      <span className="tracking-wider text-xs uppercase font-semibold text-white/40">Active Context / Git Diff Payload</span>
                    </h3>
                    <p className="text-[11px] text-white/40 mt-1">Payload captured for: {selectedEntry.file}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 font-mono text-white/60 bg-black/40 border border-white/[0.05] rounded-md">
                    {new Date(selectedEntry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="bg-black/40 rounded-xl border border-white/[0.05] p-4 font-mono text-xs overflow-x-auto max-h-[350px] leading-relaxed">
                  <pre className="text-white/80">
                    {selectedEntry.diff.split("\n").map((line, lIdx) => {
                      let lineClass = "text-white/40";
                      if (line.startsWith("+") && !line.startsWith("+++")) {
                        lineClass = "text-[#00f2fe] bg-[#00f2fe]/5 px-1.5 py-0.5 rounded";
                      } else if (line.startsWith("-") && !line.startsWith("---")) {
                        lineClass = "text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded";
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
            )}
          </section>

          {/* RIGHT PANEL: CONTROLS */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            
            {/* COGNEE SERVICE METRICS */}
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00f2fe]" />
                <span className="tracking-wider text-xs uppercase font-semibold text-white/40">Graph Engine Status</span>
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                  <span className="text-xs text-white/50">Meta Database</span>
                  <span className="text-xs font-bold text-[#00f2fe] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full shadow-[0_0_8px_#00f2fe]"></span>
                    SQLite
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                  <span className="text-xs text-white/50">Vector Store</span>
                  <span className="text-xs font-bold text-[#00f2fe] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full shadow-[0_0_8px_#00f2fe]"></span>
                    LanceDB
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                  <span className="text-xs text-white/50">Graph Store</span>
                  <span className="text-xs font-bold text-[#00f2fe] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00f2fe] rounded-full shadow-[0_0_8px_#00f2fe]"></span>
                    Kuzu Graph
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                  <span className="text-xs text-white/50">AI Config Model</span>
                  <span className="text-xs font-bold text-[#00f2fe] font-mono truncate max-w-[180px]" title={llmModel}>
                    {llmModel.split('/').pop() || 'CUSTOM'}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTEXT EXPORT PANEL */}
            <ExportCard />

            {/* ACTION CENTER */}
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00f2fe]" />
                <span className="tracking-wider text-xs uppercase font-semibold text-white/40">Action Matrix</span>
              </h2>

              <div className="flex flex-col gap-4">
                {/* Defragment button */}
                <div className="p-4 bg-black/20 border border-white/[0.03] rounded-xl flex flex-col gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Defragment Graph Memory</h3>
                    <p className="text-[10px] text-white/40 mt-1">Executes self-improvement checks, merges duplicates, and balances node weights.</p>
                  </div>
                  <button
                    onClick={() => handleAction("optimize")}
                    disabled={actionLoading !== null}
                    className="w-full bg-[#00f2fe] hover:bg-[#00f2fe]/80 text-[#07080a] font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 active:scale-[0.98] shadow-[0_0_15px_rgba(0,242,254,0.1)]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === "optimize" ? "animate-spin" : ""}`} />
                    {actionLoading === "optimize" ? "REBALANCING..." : "REBALANCE GRAPH"}
                  </button>
                </div>

                {/* Purge button */}
                <div className="p-4 bg-black/20 border border-white/[0.03] rounded-xl flex flex-col gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-rose-400">Surgical Purge & Forget</h3>
                    <p className="text-[10px] text-white/40 mt-1">Purges the current dataset from sqlite, lancedb, and graph, resetting prototyping runs.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to forget all codebase memories? This cannot be undone.")) {
                        handleAction("purge");
                      }
                    }}
                    disabled={actionLoading !== null}
                    className="w-full bg-transparent hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {actionLoading === "purge" ? "WIPING..." : "WIPE LOCAL MEMORIES"}
                  </button>
                </div>
              </div>
            </div>

            {/* INTEGRATION TIPS */}
            <div className="border border-white/[0.05] bg-white/[0.01] backdrop-blur-lg rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#00f2fe]" />
                <span className="tracking-wider text-xs uppercase font-semibold text-white/40">Prompt Integration</span>
              </h3>
              <p className="text-[11px] leading-relaxed text-white/50">
                Use <code className="text-[#00f2fe] bg-black/40 border border-white/[0.05] px-1 py-0.5 rounded font-mono">python devbrain.py export</code> to compile a dense Markdown manifest containing these recorded decisions. You can inject this manifest directly into system prompts of assistants to ensure continuous repository awareness.
              </p>
            </div>
            
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/[0.05] text-center">
        <p className="text-xs text-white/30 font-mono tracking-widest">DEVBRAIN TELEMETRY COCKPIT • COGNEE HACKATHON 2026 • 100% LOCAL-FIRST SOVEREIGNTY</p>
      </footer>
    </div>
  );
}
