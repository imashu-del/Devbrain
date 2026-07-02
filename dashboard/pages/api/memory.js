import { exec, spawn } from "child_process";
import path from "path";

import fs from "fs";


const runPythonJson = (parentDir, args, timeout = 35000) => {
  return new Promise((resolve) => {
    const child = spawn("python", args, {
      cwd: parentDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Python command timed out.", stderr });
    }, timeout);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const parsed = JSON.parse(stdout.trim() || "{}");
        resolve({ ...parsed, exitCode: code, stderr });
      } catch (err) {
        resolve({ ok: false, error: `Invalid Python JSON output: ${err.message}`, stdout, stderr, exitCode: code });
      }
    });
  });
};

const checkHarvesterRunning = () => {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows 
      ? 'wmic process where "CommandLine like \'%harvester.py%\' or CommandLine like \'%devbrain.py watch%\'" get CommandLine,ProcessId'
      : 'ps aux | grep -E "harvester.py|devbrain.py watch" | grep -v grep';
    exec(cmd, (err, stdout) => {
      if (err) {
        resolve(false);
        return;
      }
      if (isWindows) {
        const lines = stdout.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let count = 0;
        for (const line of lines) {
          if (line.includes('ProcessId') || line.includes('wmic') || line.includes('WMIC.exe')) {
            continue;
          }
          if (line.includes('harvester.py') || line.includes('devbrain.py watch')) {
            count++;
          }
        }
        resolve(count > 0);
      } else {
        const lines = stdout.split('\n').filter(line => line.trim().length > 0);
        resolve(lines.length > 0);
      }
    });
  });
};

export default async function handler(req, res) {
  const parentDir = path.join(process.cwd(), "..");
  
  // Resolve DEVBRAIN_MODE and DEVBRAIN_LLM_PROVIDER directly from parent .env file or environment variables
  let devbrainMode = "local";
  let devbrainLLMProvider = "nemotron";
  try {
    const envPath = path.join(parentDir, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      
      const matchMode = envContent.match(/DEVBRAIN_MODE\s*=\s*["']?([\w-]+)["']?/);
      if (matchMode) {
        devbrainMode = matchMode[1].replace(/['"\r\n]/g, "").trim().toLowerCase();
      }
      
      const matchProvider = envContent.match(/DEVBRAIN_LLM_PROVIDER\s*=\s*["']?([\w-]+)["']?/);
      if (matchProvider) {
        devbrainLLMProvider = matchProvider[1].replace(/['"\r\n]/g, "").trim().toLowerCase();
      }
    }
  } catch (err) {
    devbrainMode = (process.env.DEVBRAIN_MODE || "local").replace(/['"\r\n]/g, "").trim().toLowerCase();
    devbrainLLMProvider = (process.env.DEVBRAIN_LLM_PROVIDER || "nemotron").replace(/['"\r\n]/g, "").trim().toLowerCase();
  }

  if (req.method === "GET") {
    const isHarvesting = await checkHarvesterRunning();
    const result = await runPythonJson(parentDir, ["get_dashboard_data.py"], 35000);
    if (!result || result.ok === false && !result.entries) {
      return res.status(200).json({
        entries: getMockTimelineData(),
        mode: devbrainMode,
        provider: devbrainLLMProvider,
        llmModel: devbrainLLMProvider === 'nemotron' ? 'openai/nvidia/nemotron-3-ultra-550b-a55b' : 'gpt-4o-mini',
        embedding_provider: devbrainLLMProvider === 'nemotron' ? 'fastembed' : 'openai',
        embedding_dimensions: devbrainLLMProvider === 'nemotron' ? 384 : 1536,
        isHarvesting,
        nodes: [],
        edges: [],
        files: [],
        memoryStatus: { healthy: false, source: 'fallback', fallbackUsed: true, lastError: result?.error || 'Dashboard data unavailable.' }
      });
    }
    return res.status(200).json({ ...result, isHarvesting });
  } 
  
  else if (req.method === "POST") {
    const { action, dataset } = req.body;
    
    if (action === "optimize") {
      const result = await runPythonJson(parentDir, ["devbrain_bridge.py", "optimize"], 45000);
      if (!result.ok) {
        return res.status(500).json({ error: result.error || "Graph optimization failed.", details: result });
      }
      return res.status(200).json({ message: "Graph memory optimized and measured successfully.", result });
    } 
    
    else if (action === "purge") {
      const targetDataset = dataset || "main_dataset";
      const result = await runPythonJson(parentDir, ["devbrain_bridge.py", "purge", "--dataset", targetDataset], 30000);
      if (!result.ok) {
        return res.status(400).json({ error: result.error || "Memory purge failed.", details: result });
      }
      return res.status(200).json({ message: `Memory dataset '${targetDataset}' purged successfully.`, result });
    } 
    
    else {
      return res.status(400).json({ error: "Invalid action type" });
    }
  } 
  
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

function parseTimeline(output) {
  if (!output) return [];
  
  const blocks = output.split("[Codebase Watchdog Log]");
  const entries = [];
  
  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;
    
    if (!block.includes("File:")) {
      // General design decisions or manual architectural entries
      entries.push({
        file: "💡 System Design",
        timestamp: new Date().toISOString(),
        snippets: block.substring(0, 100) + (block.length > 100 ? "..." : ""),
        diff: block
      });
      continue;
    }
    
    const lines = block.split("\n");
    let file = "Unknown File";
    let timestamp = new Date().toISOString();
    let snippets = "";
    let diff = "";
    let readingDiff = false;
    
    for (let line of lines) {
      if (readingDiff) {
        diff += line + "\n";
      } else if (line.startsWith("File:")) {
        file = line.replace("File:", "").trim();
      } else if (line.startsWith("Timestamp:")) {
        timestamp = line.replace("Timestamp:", "").trim();
      } else if (line.startsWith("Modified Line Snippets")) {
        snippets = line.substring(line.indexOf(":") + 1).trim();
      } else if (line.startsWith("Git Diff:")) {
        readingDiff = true;
      }
    }
    
    entries.push({
      file,
      timestamp,
      snippets,
      diff: diff.trim() || "No active diff captured."
    });
  }
  
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return entries;
}

function getMockTimelineData() {
  return [
    {
      file: "devbrain_core.py",
      timestamp: new Date().toISOString(),
      snippets: "cognee.config.config.llm_provider = 'custom', cognee.config.config.embedding_provider = 'fastembed', set_embedding_dimensions(384)",
      diff: "+ cognee.config.config.llm_provider = 'custom'\n+ cognee.config.config.embedding_provider = 'fastembed'\n+ cognee.config.config.embedding_dimensions = 384"
    },
    {
      file: "harvester.py",
      timestamp: new Date(Date.now() - 360000).toISOString(),
      snippets: "watchdog file observer initialized and running recursively",
      diff: "+ observer.schedule(event_handler, path='.', recursive=True)\n+ observer.start()"
    },
    {
      file: "💡 System Design",
      timestamp: new Date(Date.now() - 720000).toISOString(),
      snippets: "Switched authentication to JWT for container scalability",
      diff: "Switched authentication to JWT for container scalability"
    }
  ];
}
