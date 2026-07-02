import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // Resolve project root directory absolute path
  const projectRoot = path.resolve(process.cwd(), "..");
  const devbrainScript = path.join(projectRoot, "devbrain.py");

  return new Promise((resolve) => {
    const child = spawn("python", [devbrainScript, "export"], {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      res.status(500).json({ success: false, error: "Export timed out.", stderr });
      resolve();
    }, 45000);

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        res.status(500).json({ success: false, error: `Export exited with code ${code}.`, stdout, stderr });
        return resolve();
      }

      const publicFilePath = path.join(process.cwd(), "public", "devbrain_context.md");
      if (fs.existsSync(publicFilePath)) {
        try {
          const content = fs.readFileSync(publicFilePath, "utf8");
          res.status(200).json({ success: true, filePath: '/devbrain_context.md', content, stdout });
        } catch (readErr) {
          res.status(200).json({ success: true, filePath: '/devbrain_context.md', content: '', stdout });
        }
      } else {
        res.status(500).json({ success: false, error: "Compiled manifest file was not created in the public directory.", stdout, stderr });
      }
      resolve();
    });
  });
}
