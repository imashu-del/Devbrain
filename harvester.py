import os
import time
import asyncio
import subprocess
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import devbrain_core
import dotenv

# Load environment variables
dotenv.load_dotenv()

class CodebaseHarvesterHandler(FileSystemEventHandler):
    def __init__(self, loop):
        self.loop = loop
        self.last_triggered = {}  # filepath -> timestamp (float) for debouncing

    def on_modified(self, event):
        if event.is_directory:
            return

        filepath = os.path.abspath(event.src_path)
        filename = os.path.basename(filepath)
        _, ext = os.path.splitext(filepath)
        
        # Monitor only development files
        valid_extensions = {".py", ".js", ".ts", ".go", ".md"}
        if ext.lower() not in valid_extensions:
            return

        # Ignore specific directories (.git, node_modules, venv) and Cognee internal storage
        path_parts = filepath.split(os.sep)
        ignore_dirs = {".git", "node_modules", "venv", ".cognee_system", ".cognee_data"}
        if any(part in ignore_dirs for part in path_parts):
            return

        # Debounce to prevent multiple rapid triggers for a single save event
        current_time = time.time()
        if filepath in self.last_triggered:
            if current_time - self.last_triggered[filepath] < 1.5:
                return
        self.last_triggered[filepath] = current_time

        print(f"\n[Harvester] File modification captured: {filename}")
        
        # Schedule the async task to run on the main thread's event loop
        asyncio.run_coroutine_threadsafe(self.process_change(filepath), self.loop)

    async def process_change(self, filepath):
        if not os.path.exists(filepath):
            return
        filename = os.path.basename(filepath)
        print(f"[Harvester] Processing change for: {filename}...")

        # Run git diff HEAD in a thread pool to avoid blocking the event loop
        def get_git_diff():
            try:
                # Get the git diff specifically for this file
                result = subprocess.run(
                    ["git", "diff", "HEAD", "--", filepath],
                    capture_output=True,
                    text=True,
                    check=False
                )
                return result.stdout.strip()
            except Exception as e:
                return f"Error running git diff: {e}"

        git_diff = await asyncio.to_thread(get_git_diff)

        # Extract modified line snippets from git diff
        added_lines = []
        if git_diff and not git_diff.startswith("Error"):
            for line in git_diff.splitlines():
                # Lines added start with '+' (but not '+++')
                if line.startswith("+") and not line.startswith("+++"):
                    added_lines.append(line[1:].strip())

        snippets = ", ".join(added_lines[:5]) if added_lines else "No modifications in git diff."
        timestamp = datetime.now().isoformat()

        # Bundle the collected information into a memory payload
        memory_payload = (
            f"[Codebase Watchdog Log]\n"
            f"File: {filename}\n"
            f"Absolute Path: {filepath}\n"
            f"Timestamp: {timestamp}\n"
            f"Modified Line Snippets (up to 5): {snippets}\n"
            f"Git Diff:\n{git_diff or 'No changes found in active git diff.'}"
        )

        try:
            # Store the log in the local Cognee graph database
            await devbrain_core.store_memory(memory_payload)
            print(f"[Harvester] Successfully synchronized and stored memory for {filename}.")
        except Exception as e:
            print(f"[Harvester] Error synchronizing memory for {filename}: {e}")

async def main():
    print("Initializing Cognee Local Database...")
    await devbrain_core.init_memory()

    loop = asyncio.get_running_loop()
    event_handler = CodebaseHarvesterHandler(loop)
    
    observer = Observer()
    # Monitor the current directory tree recursively
    observer.schedule(event_handler, path=".", recursive=True)
    
    print("\n[Harvester] Starting codebase background harvester...")
    print("[Harvester] Watching for file modifications (.py, .js, .ts, .go, .md)...")
    print("[Harvester] Press Ctrl+C to stop.")
    
    observer.start()
    
    try:
        while True:
            # Keep the async main thread alive
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        print("[Harvester] Background worker cancelled. Shutting down...")
    except KeyboardInterrupt:
        print("[Harvester] Received interrupt signal. Shutting down...")
    finally:
        observer.stop()
        observer.join()
        print("[Harvester] Harvester stopped.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Harvester] Harvester stopped.")
