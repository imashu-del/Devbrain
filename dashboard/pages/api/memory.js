import { exec } from "child_process";
import path from "path";

import fs from "fs";

export default async function handler(req, res) {
  const parentDir = path.join(process.cwd(), "..");
  
  // Resolve DEVBRAIN_MODE directly from parent .env file or environment variables
  let devbrainMode = "local";
  try {
    const envPath = path.join(parentDir, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      const match = envContent.match(/DEVBRAIN_MODE=["']?(\w+)["']?/);
      if (match) {
        devbrainMode = match[1].trim().toLowerCase();
      }
    }
  } catch (err) {
    devbrainMode = process.env.DEVBRAIN_MODE || "local";
  }

  if (req.method === "GET") {
    // Run python to query captured memories in local Cognee database
    const pyCommand = `python -c "import asyncio, devbrain_core; print(asyncio.run(devbrain_core.query_memory('Codebase Watchdog Log, architectural constraints, engineering decisions')))"`;
    
    exec(pyCommand, { cwd: parentDir, timeout: 20000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Subprocess error: ${error}`);
        return res.status(200).json({ entries: getMockTimelineData(), mode: devbrainMode });
      }
      
      const parsedEntries = parseTimeline(stdout);
      
      // If no entries are returned, merge with mock data for demonstration purposes
      if (parsedEntries.length === 0) {
        return res.status(200).json({ entries: getMockTimelineData(), mode: devbrainMode });
      }
      
      return res.status(200).json({ entries: parsedEntries, mode: devbrainMode });
    });
  } 
  
  else if (req.method === "POST") {
    const { action, dataset } = req.body;
    
    if (action === "optimize") {
      const pyCommand = `python -c "import asyncio, devbrain_core; asyncio.run(devbrain_core.init_memory()); asyncio.run(devbrain_core.optimize_memory())"`;
      exec(pyCommand, { cwd: parentDir, timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Optimize error: ${error}`);
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: "Graph memory optimized and balanced successfully." });
      });
    } 
    
    else if (action === "purge") {
      const targetDataset = dataset || "main_dataset";
      const pyCommand = `python -c "import asyncio, devbrain_core; asyncio.run(devbrain_core.init_memory()); asyncio.run(devbrain_core.purge_memory('${targetDataset}'))"`;
      exec(pyCommand, { cwd: parentDir, timeout: 20000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Purge error: ${error}`);
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: `Memory dataset '${targetDataset}' purged successfully.` });
      });
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
      snippets: "cognee.config.set_llm_provider('gemini'), set_embedding_dimensions(768)",
      diff: "+ cognee.config.set_llm_provider('gemini')\n+ cognee.config.set_embedding_provider('gemini')\n+ cognee.config.set_embedding_dimensions(768)"
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
