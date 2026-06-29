import React, { useState, useEffect } from "react";
import Head from "next/head";
import { 
  Activity, 
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
  const [providerName, setProviderName] = useState("gemini");

  // Fetch timeline data from local Cognee memory API
  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memory");
      const data = await res.json();
      setTimeline(data.entries || []);
      setMode(data.mode || "local");
      setProviderName(data.provider || "gemini");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Head>
        <title>DevBrain Cockpit - Cognee local-first memory</title>
        <meta name="description" content="Persistent Memory Layer for Software Development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* TOP HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-950/40">
              <Cpu className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-slate-200">
                DevBrain Cockpit
              </h1>
              <p className="text-xs text-slate-400">Local-First Developer Persistent Memory System</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Brain Matrix telemetry indicator block */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-905 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Brain Matrix:</span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 uppercase">
                {providerName === "nemotron" ? "🤖 NEMOTRON_3_ULTRA" : providerName}
              </span>
            </div>

            {/* Engine Mode telemetry indicator block */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-905 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Engine Mode:</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                mode === "cloud" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {mode === "cloud" ? "☁️ COGNEE_CLOUD" : "💻 LOCAL_OSS"}
              </span>
            </div>

            {/* Active Context Sync Status Banner */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 font-medium mr-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Sync Engines:
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Antigravity
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Cursor
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Claude Code
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/40 text-slate-500 border border-slate-800">
                  Codex
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl transition-all duration-300 ${
          notification.type === "error" 
            ? "bg-rose-950/70 border-rose-500/20 text-rose-200" 
            : "bg-emerald-950/70 border-emerald-500/20 text-emerald-200"
        }`}>
          {notification.type === "error" ? <AlertTriangle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: TIMELINE */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    Chronological Timeline
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time repository updates & design context records</p>
                </div>
                <button 
                  onClick={fetchTimeline}
                  className="p-2 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-lg border border-slate-700 transition"
                  title="Refresh Timeline"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              {/* SEARCH FILTER */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter harvested code modifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 transition placeholder:text-slate-600"
                />
              </div>

              {/* TIMELINE LIST */}
              {loading ? (
                <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm font-medium">Reading memory slices from local Cognee DB...</p>
                </div>
              ) : filteredTimeline.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-850 rounded-xl">
                  <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 font-medium">No memory segments found matching the criteria.</p>
                  <p className="text-xs text-slate-500 mt-1">Make changes in your code or run tests to populate the graph.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-800 pl-6 ml-3 flex flex-col gap-6">
                  {filteredTimeline.map((entry, idx) => {
                    const isSelected = selectedEntry && selectedEntry.timestamp === entry.timestamp && selectedEntry.file === entry.file;
                    return (
                      <div 
                        key={idx}
                        className={`relative group cursor-pointer p-4 rounded-xl border transition ${
                          isSelected 
                            ? "bg-slate-900 border-emerald-500/30 shadow-lg shadow-slate-950/50" 
                            : "bg-slate-900/20 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800"
                        }`}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {/* Bullet Icon */}
                        <div className={`absolute -left-[31px] top-4.5 w-3.5 h-3.5 rounded-full border transition ${
                          isSelected 
                            ? "bg-emerald-400 border-emerald-400" 
                            : "bg-slate-950 border-slate-700 group-hover:border-emerald-500"
                        }`}></div>

                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5 text-slate-500" />
                            {entry.file}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-900/50">
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
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      Active Context / Git Diff Details
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Payload captured for: {selectedEntry.file}</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 font-mono text-slate-400 bg-slate-950 border border-slate-850 rounded-md">
                    {new Date(selectedEntry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-950 rounded-xl border border-slate-850/80 p-4 font-mono text-xs overflow-x-auto max-h-[350px] leading-relaxed">
                  <pre className="text-slate-300">
                    {selectedEntry.diff.split("\n").map((line, lIdx) => {
                      let lineClass = "text-slate-400";
                      if (line.startsWith("+") && !line.startsWith("+++")) {
                        lineClass = "text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded";
                      } else if (line.startsWith("-") && !line.startsWith("---")) {
                        lineClass = "text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded";
                      } else if (line.startsWith("@@")) {
                        lineClass = "text-teal-500 font-bold";
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Local Graph Engine Status
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900/50">
                  <span className="text-xs text-slate-400">Meta Database</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    SQLite (Active)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900/50">
                  <span className="text-xs text-slate-400">Vector Store</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    LanceDB (Active)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900/50">
                  <span className="text-xs text-slate-400">Graph Store</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    Kuzu Graph (Active)
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-950/50 p-3 rounded-xl border border-slate-900/50">
                  <span className="text-xs text-slate-400">AI Platform</span>
                  <span className="text-xs font-bold text-teal-300">
                    Google Gemini
                  </span>
                </div>
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Memory Action Center
              </h2>

              <div className="flex flex-col gap-4">
                {/* Defragment button */}
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">Defragment Graph Memory</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Executes self-improvement checks, merges duplicates, and balances node weights.</p>
                  </div>
                  <button
                    onClick={() => handleAction("optimize")}
                    disabled={actionLoading !== null}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === "optimize" ? "animate-spin" : ""}`} />
                    {actionLoading === "optimize" ? "Defragmenting..." : "Rebalance Graph"}
                  </button>
                </div>

                {/* Purge button */}
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-rose-400">Surgical Purge & Forget</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Purges the current dataset from sqlite, lancedb, and graph, resetting prototyping runs.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to forget all codebase memories? This cannot be undone.")) {
                        handleAction("purge");
                      }
                    }}
                    disabled={actionLoading !== null}
                    className="w-full bg-transparent hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {actionLoading === "purge" ? "Purging..." : "Wipe Local Memories"}
                  </button>
                </div>
              </div>
            </div>

            {/* INTEGRATION TIPS */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Prompt Manifest Integration
              </h3>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Use <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">python devbrain.py export</code> to compile a dense Markdown manifest containing these recorded decisions. You can inject this manifest directly into system prompts of assistants to ensure continuous repository awareness.
              </p>
            </div>
            
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 text-center">
        <p className="text-xs text-slate-600">DevBrain - Cognee Hackathon 2026 Submission. 100% Local-First Engine.</p>
      </footer>
    </div>
  );
}
