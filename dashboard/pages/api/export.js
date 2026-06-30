import { exec } from "child_process";
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

  // On Windows, wrap paths in double quotes in case of spaces in directories
  const command = `python "${devbrainScript}" export`;

  return new Promise((resolve) => {
    exec(command, { cwd: projectRoot, timeout: 45000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Export execution error: ${error}`);
        console.error(`Stderr: ${stderr}`);
        res.status(500).json({ success: false, error: error.message, stderr });
        return resolve();
      }

      console.log(`Export stdout: ${stdout}`);

      // Verify the output file exists in dashboard/public
      const publicFilePath = path.join(process.cwd(), "public", "devbrain_context.md");
      if (fs.existsSync(publicFilePath)) {
        try {
          const content = fs.readFileSync(publicFilePath, "utf8");
          res.status(200).json({ 
            success: true, 
            filePath: '/devbrain_context.md',
            content: content
          });
        } catch (readErr) {
          console.error(`Failed to read compiled context file: ${readErr}`);
          res.status(200).json({ 
            success: true, 
            filePath: '/devbrain_context.md',
            content: ''
          });
        }
      } else {
        res.status(500).json({ 
          success: false, 
          error: "Compiled manifest file was not created in the public directory." 
        });
      }
      resolve();
    });
  });
}
