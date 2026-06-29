import os
import sys
import argparse
import asyncio
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
    print(ASCII_HEADER)
    
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
    
    args = parser.parse_args()
    
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
            # Must run init_memory first to initialize directory configurations
            asyncio.run(devbrain_core.init_memory())
            asyncio.run(devbrain_core.optimize_memory())
            print("[DevBrain] Local memory graph optimization and pruning completed successfully.")
        except Exception as e:
            print(f"[DevBrain] Optimization process failed: {e}")
            sys.exit(1)
            
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
