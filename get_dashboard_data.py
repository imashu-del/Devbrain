import asyncio
import json
import sqlite3
import os
import sys

# Add the current directory to sys.path to resolve devbrain_core
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

import devbrain_core

async def get_dashboard_data():
    # Force mock parameters for offline testing safety if API key is fake
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"
    if not os.environ.get("MOCK_EMBEDDING"):
        # If no real key detected, set mock embedding
        llm_choice = os.getenv("DEVBRAIN_LLM_PROVIDER", "nemotron").strip().lower()
        nemotron_key = os.getenv("NEMOTRON_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        
        has_key = (
            (llm_choice == "nemotron" and nemotron_key and "your" not in nemotron_key.lower()) or
            (llm_choice == "openai" and openai_key and "your" not in openai_key.lower()) or
            (llm_choice == "ollama")
        )
        if not has_key:
            os.environ["MOCK_EMBEDDING"] = "true"
            
    await devbrain_core.init_memory()
    
    import cognee
    llm_model = cognee.config.config.llm_model
    llm_provider = cognee.config.config.llm_provider
    embedding_provider = cognee.config.config.embedding_provider
    embedding_dimensions = cognee.config.config.embedding_dimensions
    
    devbrain_mode = os.getenv("DEVBRAIN_MODE", "local").strip().strip('"').strip("'").lower()
    
    # Query timeline context
    timeline_str = ""
    try:
        timeline_str = await devbrain_core.query_memory('Codebase Watchdog Log, architectural constraints, engineering decisions')
    except Exception as e:
        sys.stderr.write(f"Timeline query error: {e}\n")
        
    def parse_timeline(output):
        if not output:
            return []
        blocks = output.split("[Codebase Watchdog Log]")
        entries = []
        for block in blocks:
            block = block.strip()
            if not block:
                continue
            if "File:" not in block:
                from datetime import datetime
                entries.append({
                    "file": "💡 System Design",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "snippets": block[:100] + ("..." if len(block) > 100 else ""),
                    "diff": block
                })
                continue
            
            lines = block.split("\n")
            file = "Unknown File"
            from datetime import datetime
            timestamp = datetime.utcnow().isoformat() + "Z"
            snippets = ""
            diff = ""
            reading_diff = False
            for line in lines:
                if reading_diff:
                    diff += line + "\n"
                elif line.startswith("File:"):
                    file = line.replace("File:", "").strip()
                elif line.startswith("Timestamp:"):
                    timestamp = line.replace("Timestamp:", "").strip()
                elif line.startswith("Modified Line Snippets"):
                    snippets = line[line.find(":")+1:].strip()
                elif line.startswith("Git Diff:"):
                    reading_diff = True
            entries.append({
                "file": file,
                "timestamp": timestamp,
                "snippets": snippets,
                "diff": diff.strip() or "No active diff captured."
            })
        entries.sort(key=lambda x: x["timestamp"], reverse=True)
        return entries

    parsed_entries = parse_timeline(timeline_str)
    
    nodes = []
    edges = []
    files = []
    
    db_path = os.path.join(current_dir, ".cognee_system", "databases", "cognee_db")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Retrieve nodes
            try:
                cursor.execute("SELECT id, type, label, attributes, created_at FROM nodes")
                for row in cursor.fetchall():
                    nodes.append({
                        "id": row[0],
                        "type": row[1],
                        "label": row[2],
                        "attributes": row[3],
                        "created_at": row[4]
                    })
            except Exception:
                pass
                
            # Retrieve edges
            try:
                cursor.execute("SELECT id, source_node_id, destination_node_id, relationship_name, label FROM edges")
                for row in cursor.fetchall():
                    edges.append({
                        "id": row[0],
                        "source": row[1],
                        "target": row[2],
                        "relationship_name": row[3],
                        "label": row[4]
                    })
            except Exception:
                pass
                
            # Retrieve data files
            try:
                cursor.execute("SELECT id, name, extension, mime_type, pipeline_status, data_size, created_at FROM data")
                for row in cursor.fetchall():
                    status = "pending"
                    pipeline_status = row[4]
                    if pipeline_status and "DATA_ITEM_PROCESSING_COMPLETED" in pipeline_status:
                        status = "synced"
                    files.append({
                        "id": row[0],
                        "name": row[1] if row[1] else "unnamed",
                        "extension": row[2],
                        "mime_type": row[3],
                        "status": status,
                        "size": row[5],
                        "created_at": row[6]
                    })
            except Exception:
                pass
                
            conn.close()
        except Exception as e:
            sys.stderr.write(f"Database error: {e}\n")
            
    # Mock data fallback if DB is completely empty
    if not parsed_entries:
        from datetime import datetime
        parsed_entries = [
            {
                "file": "devbrain_core.py",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "snippets": "cognee.config.config.llm_provider = 'custom', cognee.config.config.embedding_provider = 'fastembed', set_embedding_dimensions(384)",
                "diff": "+ cognee.config.config.llm_provider = 'custom'\n+ cognee.config.config.embedding_provider = 'fastembed'\n+ cognee.config.config.embedding_dimensions = 384"
            }
        ]
        
    stitch_project_id = os.getenv("STITCH_PROJECT_ID", "").strip()
    cursor_active = os.getenv("CURSOR_EXTENSION_ACTIVE", "false").strip().lower() == "true"
    claude_active = os.getenv("CLAUDE_CODE_GATEWAY_ACTIVE", "false").strip().lower() == "true"

    return {
        "entries": parsed_entries,
        "mode": devbrain_mode,
        "provider": llm_provider,
        "llmModel": llm_model,
        "embedding_provider": embedding_provider,
        "embedding_dimensions": embedding_dimensions,
        "nodes": nodes,
        "edges": edges,
        "files": files,
        "stitchProjectId": stitch_project_id,
        "cursorActive": cursor_active,
        "claudeActive": claude_active
    }

if __name__ == "__main__":
    data = asyncio.run(get_dashboard_data())
    print(json.dumps(data))
