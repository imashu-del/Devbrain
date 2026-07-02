import { spawn } from "child_process";
import path from "path";

const runPythonJson = (parentDir, args, timeout = 30000) => {
  return new Promise((resolve) => {
    const child = spawn("python", args, { cwd: parentDir, stdio: ["ignore", "pipe", "pipe"] });
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
        resolve({ ...JSON.parse(stdout.trim() || "{}"), exitCode: code, stderr });
      } catch (err) {
        resolve({ ok: false, error: `Invalid Python JSON output: ${err.message}`, stdout, stderr, exitCode: code });
      }
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  const parentDir = path.join(process.cwd(), "..");
  const result = await runPythonJson(parentDir, ["devbrain_bridge.py", "health"], 15000);
  return res.status(result.ok ? 200 : 500).json(result);
}
