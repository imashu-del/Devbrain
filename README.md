# 🧠 DevBrain: The Persistent Memory Layer for Software Development
> **Built for the Cognee 2026 Hackathon** — *Targeting the "Best Use of Open Source" Track*

---

## 🎰 The Vegas Hangover: The Problem with Compute vs. Memory

Today's AI coding assistants have a **Vegas Hangover** problem: 

> *“What happens in the chat tab, stays in the chat tab.”*

Every time you open a new chat window, restart your IDE, or switch between coding tools, the agent forgets **everything** you did. It forgets the structural dependencies, the reasoning behind that database migration, and why you refactored authentication. The model starts from scratch, wasting valuable context window space and generating redundant suggestions.

**DevBrain fixes this by decoupling Memory (State) from the IDE/LLM (Compute).** 

By running a local background harvester that continuously records file modifications, extracts diffs, and indexes them into **Cognee's** local knowledge graph (SQLite + LanceDB + Kuzu Graph) or Cognee Cloud, DevBrain serves as a persistent memory store. Any AI assistant can instantly hook into this memory layer to understand the codebase context.

---

## 🎛️ The Hybrid Architecture Paradigm Shift

DevBrain has evolved into a premium, sovereign developer engine that gives engineers complete control over both their storage topology (Hybrid Router) and their model intelligence layer (Cognitive Processor).

```
                      +---------------------------------------+
                      |           devbrain.py (CLI)           |
                      +---+-------------------------------+---+
                          |                               |
                          v                               v
            +-------------+-------------+   +-------------+-------------+
            |  harvester.py (Watcher)   |   |   dashboard/ (Cockpit UI) |
            +-------------+-------------+   +-------------+-------------+
                          |                               |
                          v (git diff)                    v (exec API)
            +-------------+-------------+   +-------------+-------------+
            | devbrain_core.py (Memory) |<--+ pages/api/memory.js (API) |
            +-------------+-------------+   +---------------------------+
                          |
             +------------+------------+
             |                         |
             v (DEVBRAIN_MODE=local)   v (DEVBRAIN_MODE=cloud)
     +-------+-------+         +-------+-------+
     | Local Kuzu DB |         | Cognee Cloud  |
     +---------------+         +---------------+
```

### 1. Storage Topology Router (`DEVBRAIN_MODE`)
- **`local` (Default)**: Guarantees privacy-first isolation for secure internal repos. Operates 100% locally on embedded SQLite, LanceDB, and Kuzu Graph databases.
- **`cloud`**: Establishes an encrypted, remote pipeline to Cognee Cloud via `cognee.serve()` for cross-device context synchronization.

### 2. Cognitive Processor Layer (`DEVBRAIN_LLM_PROVIDER`)
Developers can explicitly choose their underlying model matrix:
- **`gemini` (Default)**: Connects to Google Gemini API (e.g. `gemini-2.5-flash`) utilizing 768-dimension vector embeddings.
- **`openai`**: Routes to OpenAI models (e.g. `gpt-4o`) using 3072-dimension embeddings.
- **`anthropic`**: Connects to Anthropic Claude models (e.g. `claude-3-5-sonnet`) while gracefully routing vector embedding pairs to OpenAI embedding models for hybrid traversal.
- **`ollama`**: Runs 100% offline using local Ollama model engines and embedding dimensions.

---

## 🧠 The Core Memory Lifecycle Map

DevBrain is powered entirely by the open-source **Cognee** SDK, orchestrating the local knowledge structure using its four core primitives:

### 1. `cognee.remember()`
- **Role**: **Ingestion Engine.** Listens to active file modifications, extracts diffs, and feeds changes directly into the vector space and SQLite metadata store.
- **Method Signature**: `await cognee.remember(text_context: str)`

### 2. `cognee.recall()`
- **Role**: **Retrieval Engine.** Pulls structured memory segments, files touched, and architectural decisions to construct context manifests for prompts.
- **Method Signature**: `await cognee.recall(query_text: str)`

### 3. `cognee.improve()`
- **Role**: **Graph Defragmenter.** Prunes stale or redundant nodes, re-evaluates schema connections, and re-balances graph weights to maintain a clean repository ontology.
- **Method Signature**: `await cognee.improve()`

### 4. `cognee.forget()`
- **Role**: **Surgical Purge.** Discards prototyping runs or resets dataset trees when developers start a new branch or prototype iteration. Called with strict keyword arguments: `await cognee.forget(dataset=dataset_name)`

---

## 🛠️ Core Production Safeguards & Mitigations

During our deep security and architectural audit, we implemented several key mitigations:
- **Absolute Path Resolution**: Cognee local setups throw exceptions if paths are relative (e.g. `relative path can't be expressed as a file URI`). DevBrain dynamically resolves `./.cognee_system` and `./.data_storage` to their absolute forms before passing them to `cognee.config.set()`.
- **CP1252 Encoding Protections**: Removed raw emojis from console prints within `devbrain_core.py` to prevent `UnicodeEncodeError` issues when developers execute subcommands inside default Windows shells.
- **Process Isolation**: Spawns all subprocess shell hooks with 20-30 second timeouts and max buffer limits to ensure Next.js API routes never freeze or lock.

---

## 🔌 Supported Integrations

DevBrain outputs a serialized markdown manifest optimized for LLM system prompts. This payload can immediately hydrate context window histories in:
- **Antigravity** (Our native hackathon IDE assistant)
- **Cursor** (Via `.cursorrules` or direct clipboard insertion)
- **Claude Code** (Via `/system` prompt insertion)
- **Codex / GitHub Copilot Chat**

---

## 🚀 Quick Start (Local Setup)

### 1. Install System Dependencies
Ensure you have Python 3.10+ and Node.js installed, then install Python requirements:
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Mode Settings: 'local' (offline) or 'cloud'
DEVBRAIN_MODE="local"
DEVBRAIN_LLM_PROVIDER="gemini"

# --- Gemini Settings ---
GEMINI_LLM_MODEL="gemini/gemini-2.5-flash"
GEMINI_API_KEY="your_api_key_here"
GEMINI_EMBEDDING_MODEL="gemini/gemini-embedding-001"
GEMINI_EMBEDDING_DIMENSIONS="768"

# --- OpenAI Settings ---
OPENAI_LLM_MODEL="gpt-4o"
OPENAI_API_KEY="your_openai_key_here"
OPENAI_EMBEDDING_MODEL="text-embedding-3-large"
OPENAI_EMBEDDING_DIMENSIONS="3072"

# --- Anthropic Settings ---
ANTHROPIC_LLM_MODEL="claude-3-5-sonnet-latest"
ANTHROPIC_API_KEY="your_anthropic_key_here"
ANTHROPIC_EMBEDDING_MODEL="text-embedding-3-large"
ANTHROPIC_EMBEDDING_DIMENSIONS="3072"

# --- Ollama Settings (100% Local LLM) ---
OLLAMA_LLM_MODEL="llama3"
OLLAMA_ENDPOINT="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
OLLAMA_EMBEDDING_DIMENSIONS="768"

# --- Cognee Cloud Settings (Required only if DEVBRAIN_MODE="cloud") ---
COGNEE_API_KEY="your_cognee_cloud_key"
COGNEE_SERVICE_URL="your_cognee_cloud_endpoint"
```

### 3. Initialize Cognee DB
Verify the database migrations and schema run successfully:
```bash
python devbrain.py init
```

### 4. Start the Codebase Harvester
Launch the background watcher to record filesystem modifications and active git diffs:
```bash
python devbrain.py watch
```

### 5. Launch the Developer Cockpit
Open the interactive visual dashboard to monitor telemetry:
```bash
python devbrain.py dashboard
```
*Next.js will automatically launch on [http://localhost:3000](http://localhost:3000).*

---

## Production Memory Capture & MCP Integration

DevBrain now supports explicit reasoning capture in addition to watchdog diff capture. Use these commands to preserve answers, explanations, architecture decisions, migration rationale, and cross-tool session summaries:

```bash
python devbrain.py note --type architecture_decision "Moved auth to JWT because the deployment target needs stateless horizontal scaling."
python devbrain.py ingest-chat ./path/to/exported-session.md
python devbrain.py health
python devbrain.py datasets
python devbrain.py mcp
```

The MCP server runs over stdio and exposes tools for AI agents:

- `devbrain_capture_reasoning` stores reasoning and decisions through `cognee.remember()`.
- `devbrain_recall_context` retrieves relevant memory through `cognee.recall()`.
- `devbrain_health` reports provider, dataset, graph, and fallback status.
- `devbrain_list_datasets` lists Cognee datasets.
- `devbrain_optimize_memory` triggers `cognee.improve()` with before/after health data.

Normal initialization is non-destructive. If embedding dimensions change, DevBrain reports the mismatch instead of deleting `.cognee_system` or `.data_storage` during dashboard reads or ordinary CLI operations. Dataset purge remains explicit and uses `cognee.forget(dataset=...)`.
