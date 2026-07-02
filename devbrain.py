import os
import sys
import argparse
import asyncio
import subprocess
import devbrain_core

# Initialize Windows Terminal ANSI color support if on Windows
if os.name == "nt":
    os.system("")

ASCII_HEADER = """
\033[90m======================================================================\033[0m
\033[36m  _____            ____             _       
 |  __ \\\\          |  _ \\\\           (_)      
 | |  | | ___ _   _| |_) |_ __ __ _ _ _ __  
 | |  | |/ _ \\\\ \\\\ / /  _ <| '__/ _` | | '_ \\\\ 
 | |__| |  __/\\\\ V /| |_) | | | (_| | | | | |
 |_____/ \\\\___| \\\\_/ |____/|_|  \\__,_|_|_| |_|
\033[0m\033[94m  The Persistent Memory Layer for Software Development (Local Edition)\033[0m
\033[90m======================================================================\033[0m
"""

def main():
    parser = argparse.ArgumentParser(
        description="DevBrain CLI - Managing persistent developer context and knowledge graphs local-first.",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Subcommands")
    
    # command: init
    subparsers.add_parser(
        "init", 
        help="Initialize the local environment check, configure system directories, and ensure Cognee databases are ready."
    )
    
    # command: watch
    subparsers.add_parser(
        "watch", 
        help="Launch the background harvester. Watches the filesystem for file edits, extracts diffs, and saves them to local memory."
    )
    
    # command: export
    subparsers.add_parser(
        "export", 
        help="Query the local knowledge graph and generate a dense project memory manifest (devbrain_manifest.md) for LLM prompts."
    )
    
    # command: optimize
    subparsers.add_parser(
        "optimize", 
        help="Trigger Cognee memory improvement engine (improve) to balance graph node weights and prune stale memories."
    )
    
    # command: note
    note_parser = subparsers.add_parser(
        "note",
        help="Capture an architectural decision, explanation, or reasoning note into DevBrain memory."
    )
    note_parser.add_argument("text", nargs="+", help="Note text to store in Cognee memory.")
    note_parser.add_argument("--type", default="manual_note", help="Memory event type, e.g. architecture_decision or implementation_reasoning.")

    # command: ingest-chat
    ingest_parser = subparsers.add_parser(
        "ingest-chat",
        help="Ingest an exported chat/session markdown or text file into DevBrain memory."
    )
    ingest_parser.add_argument("path", help="Path to a .md, .txt, or .json chat/session export.")
    ingest_parser.add_argument("--type", default="tool_session_summary", help="Memory event type for this imported session.")

    # command: health
    subparsers.add_parser(
        "health",
        help="Print Cognee memory health, provider configuration, datasets, and graph counts as JSON."
    )

    # command: datasets
    subparsers.add_parser(
        "datasets",
        help="List known Cognee datasets as JSON."
    )

    # command: mcp
    subparsers.add_parser(
        "mcp",
        help="Run the DevBrain MCP stdio server for AI agents."
    )
    
    # command: dashboard
    subparsers.add_parser(
        "dashboard", 
        help="Launch the Next.js interactive developer dashboard cockpit (local-first)."
    )
    
    args = parser.parse_args()

    quiet_commands = {"health", "datasets", "mcp"}
    if args.command not in quiet_commands:
        print(ASCII_HEADER)
    
    if args.command == "init":
        print("[DevBrain] Initializing Cognee local configurations...")
        try:
            asyncio.run(devbrain_core.init_memory())
            print("[DevBrain] Local Cognee sqlite and vector configurations loaded successfully.")
        except Exception as e:
            print(f"[DevBrain] Initialization failed: {e}")
            sys.exit(1)
            
    elif args.command == "watch":
        print("[DevBrain] Launching background filesystem watcher (harvester)...")
        import harvester
        try:
            asyncio.run(harvester.main())
        except KeyboardInterrupt:
            print("\n[DevBrain] File harvester stopped.")
        except Exception as e:
            print(f"[DevBrain] File harvester failed: {e}")
            sys.exit(1)
            
    elif args.command == "export":
        print("[DevBrain] Compiling project memory manifest...")
        import exporter
        try:
            asyncio.run(exporter.export_context())
            print("[DevBrain] Project manifest exportation complete.")
        except Exception as e:
            print(f"[DevBrain] Exportation failed: {e}")
            sys.exit(1)
            
    elif args.command == "optimize":
        print("[DevBrain] Optimizing Cognee knowledge graph...")
        try:
            asyncio.run(devbrain_core.init_memory())
            result = asyncio.run(devbrain_core.optimize_memory())
            print(f"[DevBrain] Local memory graph optimization completed: {result.get('source', 'cognee')}.")
        except Exception as e:
            print(f"[DevBrain] Optimization process failed: {e}")
            sys.exit(1)

    elif args.command == "note":
        note_text = " ".join(args.text).strip()
        try:
            result = asyncio.run(devbrain_core.capture_memory_event(args.type, note_text, {"source": "cli-note"}))
            if not result.get("ok"):
                raise RuntimeError(result.get("error"))
            print(f"[DevBrain] Captured note into memory ({result.get('source')}).")
        except Exception as e:
            print(f"[DevBrain] Note capture failed: {e}")
            sys.exit(1)

    elif args.command == "ingest-chat":
        try:
            path = os.path.abspath(args.path)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            result = asyncio.run(devbrain_core.capture_memory_event(args.type, content, {"source": "cli-ingest-chat", "path": path}))
            if not result.get("ok"):
                raise RuntimeError(result.get("error"))
            print(f"[DevBrain] Ingested chat/session file into memory ({result.get('source')}).")
        except Exception as e:
            print(f"[DevBrain] Chat/session ingestion failed: {e}")
            sys.exit(1)

    elif args.command == "health":
        import json
        print(json.dumps(devbrain_core.get_memory_health(), indent=2))

    elif args.command == "datasets":
        import json
        print(json.dumps(devbrain_core.list_datasets(), indent=2))

    elif args.command == "mcp":
        try:
            import devbrain_mcp
            devbrain_mcp.main()
        except Exception as e:
            print(f"[DevBrain] MCP server failed: {e}", file=sys.stderr)
            sys.exit(1)
            
    elif args.command == "dashboard":
        print("[DevBrain] Launching interactive developer cockpit (Next.js)...")
        workspace_dir = os.path.dirname(os.path.abspath(__file__))
        dashboard_dir = os.path.join(workspace_dir, "dashboard")
        try:
            # Check and install node dependencies if missing
            if not os.path.exists(os.path.join(dashboard_dir, "node_modules")):
                print("[DevBrain] node_modules not found in dashboard directory. Installing dependencies...")
                subprocess.run("npm install", cwd=dashboard_dir, shell=True, check=True)
            
            print("[DevBrain] Starting dev server. Opening browser at http://localhost:3000...")
            # Run dev server blocking, letting developers interact and see compilation logs
            subprocess.run("npm run dev", cwd=dashboard_dir, shell=True, check=True)
        except KeyboardInterrupt:
            print("\n[DevBrain] Dashboard cockpit shut down.")
        except Exception as e:
            print(f"[DevBrain] Failed to start Next.js cockpit: {e}")
            sys.exit(1)
            
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
