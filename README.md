# 🧠 DevBrain: The Persistent Memory Layer for Software Development
> **Built for the Cognee 2026 Hackathon** — *Targeting the "Best Use of Open Source" Track*

---

## 🎰 The Vegas Hangover: The Problem with Compute vs. Memory

Today's AI coding assistants have a **Vegas Hangover** problem: 

> *“What happens in the chat tab, stays in the chat tab.”*

Every time you open a new chat window, restart your IDE, or switch between coding tools, the agent forgets **everything** you did. It forgets the structural dependencies, the reasoning behind that database migration, and why you refactored authentication. The model starts from scratch, wasting valuable context window space and generating redundant suggestions.

**DevBrain fixes this by decoupling Memory (State) from the IDE/LLM (Compute).** 

By running a local background harvester that continuously records file modifications, extracts diffs, and indexes them into **Cognee's** local knowledge graph (SQLite + LanceDB + Kuzu Graph), DevBrain serves as a local-first memory store. Any AI assistant can instantly hook into this memory layer to understand the codebase context.

---

## 🧠 The Core Memory Lifecycle Map

DevBrain is powered entirely by the open-source **Cognee** SDK, orchestrating the local knowledge structure using its four core primitives:

```
                      +-------------------+
                      |   File Watcher    |
                      +---------+---------+
                                |
                                v (git diff)
                      +-------------------+
                      |  cognee.remember  |
                      +---------+---------+
                                |
          +---------------------+---------------------+
          |                                           |
          v                                           v
+-------------------+                       +-------------------+
|   cognee.recall   |                       |   cognee.improve  |
+---------+---------+                       +---------+---------+
          |                                           |
          v (prompt manifests)                        v (defrag)
+-------------------+                       +-------------------+
|  System Prompts   |                       |   Balanced Graph  |
+-------------------+                       +-------------------+
```

### 1. `cognee.remember()`
- **Role in DevBrain**: **Ingestion Engine.** Listens to active file modifications, extracts diffs, and feeds changes directly into the LanceDB vector space and SQLite metadata store.
- **Method Signature**: `await cognee.remember(text_context: str)`

### 2. `cognee.recall()`
- **Role in DevBrain**: **Retrieval Engine.** Pulls structured memory segments, files touched, and architectural decisions to construct context manifests for prompts.
- **Method Signature**: `await cognee.recall(query_text: str)`

### 3. `cognee.improve()`
- **Role in DevBrain**: **Graph Defragmenter.** Prunes stale or redundant nodes, re-evaluates schema connections, and re-balances graph weights to maintain a clean repository ontology.
- **Method Signature**: `await cognee.improve()`

### 4. `cognee.forget()`
- **Role in DevBrain**: **Surgical Purge.** Discards prototyping runs or resets dataset trees when developers start a new branch or prototype iteration.
- **Method Signature**: `await cognee.forget(dataset=dataset_name)`

---

## 🏗️ Architecture & Component Overview

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
                          v (git diff)                    v (exec hooks)
            +-------------+-------------+   +-------------+-------------+
            | devbrain_core.py (Memory) |<--+ pages/api/memory.js (API) |
            +-------------+-------------+   +---------------------------+
                          |
                          v
            +-------------+-------------+
            |     Local Cognee Store     |
            | (SQLite + Kuzu + LanceDB) |
            +---------------------------+
```

### 🛠️ Core Modules
1. **[devbrain_core.py](file:///c:/Users/user/Downloads/Devbrain/devbrain_core.py)**: Configures Cognee to target local project directories (`.cognee_system` and `.cognee_data`) and integrates Gemini model and embedding sizes (768d).
2. **[harvester.py](file:///c:/Users/user/Downloads/Devbrain/harvester.py)**: A background worker utilizing `watchdog` to monitor `.py, .js, .ts, .go, .md` files. It features a **1.5-second debounce buffer** to coalesce rapid IDE file writes and schedules asynchronous Git diff collections in thread pools.
3. **[exporter.py](file:///c:/Users/user/Downloads/Devbrain/exporter.py)**: Queries memory to construct a dense project context manifest file ([devbrain_manifest.md](file:///c:/Users/user/Downloads/Devbrain/devbrain_manifest.md)) and copies it directly to the system clipboard.
4. **[devbrain.py](file:///c:/Users/user/Downloads/Devbrain/devbrain.py)**: The CLI master controller. Exposes `init`, `watch`, `optimize`, `export`, and `dashboard` subcommands.
5. **[dashboard/](file:///c:/Users/user/Downloads/Devbrain/dashboard/)**: A developer cockpit dashboard built using Next.js and Tailwind CSS:
   - **Chronological Timeline**: Interactively displays files modified and expands code diff summaries.
   - **Action Center**: Triggers graph defragmentation (`improve`) or database resets (`forget`) over API bridges.

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
LLM_PROVIDER="gemini"
EMBEDDING_PROVIDER="gemini"
LLM_API_KEY="your_google_gemini_api_key"
GOOGLE_API_KEY="your_google_gemini_api_key"
```

### 3. Initialize Cognee local DB
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
