import { exec, spawn } from "child_process";
import path from "path";

const getPids = () => {
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows 
      ? 'wmic process where "CommandLine like \'%harvester.py%\' or CommandLine like \'%devbrain.py watch%\'" get ProcessId'
      : 'pgrep -f "harvester.py|devbrain.py watch"';
    exec(cmd, (err, stdout) => {
      if (err || !stdout) {
        resolve([]);
        return;
      }
      const pids = stdout.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !isNaN(line) && line !== 'ProcessId');
      resolve(pids);
    });
  });
};

const killProcesses = (pids) => {
  if (pids.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    const isWindows = process.platform === "win32";
    const killCmd = isWindows
      ? `taskkill /F ${pids.map(pid => `/PID ${pid}`).join(' ')}`
      : `kill -9 ${pids.join(' ')}`;
    exec(killCmd, () => {
      resolve();
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { active } = req.body;
  const parentDir = path.join(process.cwd(), "..");

  try {
    if (active) {
      // Spawn harvester watch
      const pids = await getPids();
      if (pids.length === 0) {
        const child = spawn("python", ["devbrain.py", "watch"], {
          cwd: parentDir,
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        return res.status(200).json({ success: true, message: "Harvester subprocess spawned." });
      } else {
        return res.status(200).json({ success: true, message: "Harvester is already running." });
      }
    } else {
      // Kill harvester
      const pids = await getPids();
      await killProcesses(pids);
      return res.status(200).json({ success: true, message: "Harvester subprocess terminated." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to toggle harvester process." });
  }
}
