import os
import subprocess
import platform
import asyncio
import devbrain_core
import dotenv

# Load environment variables
dotenv.load_dotenv()

def copy_to_clipboard(text: str) -> bool:
    """Copies text to the system clipboard using native commands or fallback library."""
    try:
        system = platform.system()
        if system == "Windows":
            # Use Windows clip command
            process = subprocess.Popen("clip", stdin=subprocess.PIPE, text=True, shell=True)
            process.communicate(text)
            return True
        elif system == "Darwin":
            # Use macOS pbcopy command
            process = subprocess.Popen("pbcopy", stdin=subprocess.PIPE, text=True)
            process.communicate(text)
            return True
        else:
            # Use Linux xclip command
            process = subprocess.Popen(["xclip", "-selection", "clipboard"], stdin=subprocess.PIPE, text=True)
            process.communicate(text)
            return True
    except Exception as e:
        # Fallback to pyperclip if installed
        try:
            import pyperclip
            pyperclip.copy(text)
            return True
        except ImportError:
            pass
        print(f"[Warning] Native clipboard integration failed: {e}")
        return False

async def export_context() -> str:
    """Queries Cognee memory, builds the markdown manifest, and exports it."""
    # Ensure memory is initialized and config runs
    await devbrain_core.init_memory()

    # Query local memory for specific sections
    print("[Exporter] Retrieving architectural constraints from local graph database...")
    arch_query = "What are the core system architecture constraints, features, and active structural boundaries?"
    arch_info = await devbrain_core.query_memory(arch_query)

    print("[Exporter] Retrieving engineering decisions from local graph database...")
    decisions_query = "What are the recent engineering decisions, patterns, choices, and the 'why' behind them?"
    decisions_info = await devbrain_core.query_memory(decisions_query)

    print("[Exporter] Retrieving active feature dependencies and blockers from local graph database...")
    blockers_query = "What are the active feature dependencies, structural bottlenecks, or coding blockers?"
    blockers_info = await devbrain_core.query_memory(blockers_query)

    # Clean and set fallbacks if information is not found
    arch_content = arch_info.strip() if arch_info.strip() else "No architectural constraints or structural boundaries documented."
    decisions_content = decisions_info.strip() if decisions_info.strip() else "No engineering decisions or rationale recorded."
    blockers_content = blockers_info.strip() if blockers_info.strip() else "No active feature dependencies or structural blockers detected."

    # Format the markdown manifest
    manifest_content = (
        f"# DEVBRAIN PROJECT MEMORY\n\n"
        f"## 🏗️ System Architecture & Constraints\n"
        f"{arch_content}\n\n"
        f"## ⚖️ Engineering Decisions (The 'Why')\n"
        f"{decisions_content}\n\n"
        f"## ⚠️ Active Feature Dependencies & Structural Blockers\n"
        f"{blockers_content}\n"
    )

    # Write the compiled manifest to file
    manifest_filename = "devbrain_manifest.md"
    try:
        with open(manifest_filename, "w", encoding="utf-8") as f:
            f.write(manifest_content)
        print(f"[Exporter] Successfully compiled and saved manifest to: {manifest_filename}")
    except Exception as e:
        print(f"[Exporter] Error writing to {manifest_filename}: {e}")

    # Write a copy to dashboard/public/devbrain_context.md for dashboard export
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        dashboard_pub_dir = os.path.join(base_dir, "dashboard", "public")
        if os.path.exists(dashboard_pub_dir):
            devbrain_context_path = os.path.join(dashboard_pub_dir, "devbrain_context.md")
            with open(devbrain_context_path, "w", encoding="utf-8") as f:
                f.write(manifest_content)
            print(f"[Exporter] Successfully compiled and saved dashboard copy to: {devbrain_context_path}")
        else:
            alt_path = os.path.join("dashboard", "public", "devbrain_context.md")
            alt_dir = os.path.dirname(alt_path)
            if os.path.exists(alt_dir):
                with open(alt_path, "w", encoding="utf-8") as f:
                    f.write(manifest_content)
                print(f"[Exporter] Successfully compiled and saved dashboard copy to: {alt_path}")
    except Exception as e:
        print(f"[Exporter] Error writing dashboard public copy: {e}")

    # Copy manifest content to the clipboard
    if copy_to_clipboard(manifest_content):
        print("[Exporter] Manifest copied directly to system clipboard.")
    else:
        print("[Exporter] Clipboard copy not supported on this platform.")

    return manifest_content

if __name__ == "__main__":
    try:
        asyncio.run(export_context())
    except KeyboardInterrupt:
        print("\n[Exporter] Export execution interrupted.")
