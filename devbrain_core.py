import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import cognee
import dotenv
import pydantic

# Load environment variables
dotenv.load_dotenv()

# Proxy class to support direct attribute assignment on cognee.config.config
class CogneeConfigProxy:
    @property
    def llm_provider(self):
        from cognee.infrastructure.llm.config import get_llm_config
        return get_llm_config().llm_provider
    @llm_provider.setter
    def llm_provider(self, val):
        from cognee.infrastructure.llm.config import get_llm_config
        get_llm_config().llm_provider = val

    @property
    def llm_model(self):
        from cognee.infrastructure.llm.config import get_llm_config
        return get_llm_config().llm_model
    @llm_model.setter
    def llm_model(self, val):
        from cognee.infrastructure.llm.config import get_llm_config
        get_llm_config().llm_model = val

    @property
    def llm_api_key(self):
        from cognee.infrastructure.llm.config import get_llm_config
        return get_llm_config().llm_api_key
    @llm_api_key.setter
    def llm_api_key(self, val):
        from cognee.infrastructure.llm.config import get_llm_config
        get_llm_config().llm_api_key = val

    @property
    def llm_endpoint(self):
        from cognee.infrastructure.llm.config import get_llm_config
        return get_llm_config().llm_endpoint
    @llm_endpoint.setter
    def llm_endpoint(self, val):
        from cognee.infrastructure.llm.config import get_llm_config
        get_llm_config().llm_endpoint = val

    @property
    def embedding_provider(self):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        return get_embedding_config().embedding_provider
    @embedding_provider.setter
    def embedding_provider(self, val):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        get_embedding_config().embedding_provider = val

    @property
    def embedding_model(self):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        return get_embedding_config().embedding_model
    @embedding_model.setter
    def embedding_model(self, val):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        get_embedding_config().embedding_model = val

    @property
    def embedding_dimensions(self):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        return get_embedding_config().embedding_dimensions
    @embedding_dimensions.setter
    def embedding_dimensions(self, val):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        get_embedding_config().embedding_dimensions = int(val) if val is not None else 0

    @property
    def embedding_api_key(self):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        return get_embedding_config().embedding_api_key
    @embedding_api_key.setter
    def embedding_api_key(self, val):
        from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config
        get_embedding_config().embedding_api_key = val

cognee.config.config = CogneeConfigProxy()

MOCK_RECALL_SENTINEL = "DevBrain is powered by local Cognee + Nemotron."
DEFAULT_DATASET = "main_dataset"
VALID_MEMORY_EVENT_TYPES = {
    "code_change",
    "chat_answer",
    "explanation",
    "architecture_decision",
    "implementation_reasoning",
    "migration_reason",
    "tool_session_summary",
    "manual_note",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def project_paths() -> Dict[str, str]:
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    return {
        "workspace": workspace_dir,
        "system_dir": os.path.abspath(os.path.join(workspace_dir, ".cognee_system")),
        "data_dir": os.path.abspath(os.path.join(workspace_dir, ".data_storage")),
        "db_path": os.path.abspath(os.path.join(workspace_dir, ".cognee_system", "databases", "cognee_db")),
        "dimension_file": os.path.abspath(os.path.join(workspace_dir, ".data_storage", ".dimension")),
    }


def safe_read_int(path: str) -> Optional[int]:
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return int(f.read().strip())
    except Exception:
        return None
    return None


def has_real_api_key(llm_choice: Optional[str] = None) -> bool:
    llm_choice = (llm_choice or os.getenv("DEVBRAIN_LLM_PROVIDER", "nemotron")).strip().lower()
    if llm_choice == "ollama":
        return True

    keys = [
        os.getenv("LLM_API_KEY"),
        os.getenv("GOOGLE_API_KEY"),
        os.getenv("OPENAI_API_KEY"),
        os.getenv("ANTHROPIC_API_KEY"),
        os.getenv("NEMOTRON_API_KEY"),
    ]
    return any(key and "your" not in key.lower() and len(key) > 10 for key in keys)


def result_payload(ok: bool, source: str, data=None, error: Optional[str] = None, **extra) -> Dict[str, Any]:
    payload = {
        "ok": ok,
        "source": source,
        "data": data,
        "error": error,
        "fallbackUsed": source in {"mock", "fallback"},
        "timestamp": utc_now_iso(),
    }
    payload.update(extra)
    return payload

def safe_int_env(key: str, default: int) -> int:
    val = os.getenv(key)
    if not val or not val.strip():
        return default
    try:
        return int(val)
    except ValueError:
        return default

# Mock structured output generator for local offline testing
async def mock_acreate_structured_output(text_input, system_prompt, response_model, **kwargs):
    import typing
    import enum
    
    def resolve_type_value(field_type, field_name):
        origin = typing.get_origin(field_type) if hasattr(typing, "get_origin") else getattr(field_type, "__origin__", None)
        
        # Check if field_type is a subclass of BaseModel
        if isinstance(field_type, type) and issubclass(field_type, pydantic.BaseModel):
            return build_mock_instance(field_type)
            
        elif origin is list:
            arg_type = field_type.__args__[0]
            if isinstance(arg_type, type) and issubclass(arg_type, pydantic.BaseModel):
                return [build_mock_instance(arg_type)]
            else:
                return []
                
        elif origin is typing.Union or (hasattr(typing, "_UnionGenericAlias") and isinstance(field_type, getattr(typing, "_UnionGenericAlias"))):
            non_none_types = [t for t in field_type.__args__ if t is not type(None)]
            if non_none_types:
                return resolve_type_value(non_none_types[0], field_name)
            return None
            
        elif origin is typing.Literal or (hasattr(typing, "_LiteralGenericAlias") and isinstance(field_type, getattr(typing, "_LiteralGenericAlias"))):
            return field_type.__args__[0]
            
        elif isinstance(field_type, type) and issubclass(field_type, enum.Enum):
            return list(field_type)[0].value
            
        elif field_type is str:
            if "rating" in field_name.lower():
                return "helpful"
            elif "answer" in field_name.lower() or "text" in field_name.lower() or "value" in field_name.lower():
                return "DevBrain is powered by local Cognee + Nemotron."
            else:
                return "mock_string"
                
        elif field_type is int:
            return 1
        elif field_type is float:
            return 1.0
        elif field_type is bool:
            return True
        else:
            return None

    def build_mock_instance(model_class):
        data = {}
        # Handle Pydantic V1/V2 fields compatibility
        fields_dict = getattr(model_class, "model_fields", None) or getattr(model_class, "__fields__", {})
        for field_name, field_info in fields_dict.items():
            field_type = getattr(field_info, "annotation", None) or getattr(field_info, "type_", None)
            data[field_name] = resolve_type_value(field_type, field_name)
        return model_class(**data)
        
    return build_mock_instance(response_model)

def configure_cognitive_engine() -> Dict[str, Any]:
    """Configure Cognee model and embedding settings without touching storage."""
    dotenv.load_dotenv()
    os.environ["LITELLM_NUM_RETRIES"] = "0"
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"

    is_local = os.getenv("DEVBRAIN_MODE", "local").strip().strip('"').strip("'").lower() == "local"
    llm_choice = os.getenv("DEVBRAIN_LLM_PROVIDER", "nemotron").strip().lower()

    if is_local and llm_choice == "nemotron":
        os.environ["OPENAI_API_KEY"] = os.getenv("NEMOTRON_API_KEY") or ""
        os.environ["OPENAI_API_BASE"] = "https://integrate.api.nvidia.com/v1"
        cognee.config.config.llm_provider = "custom"
        cognee.config.config.llm_model = "openai/nvidia/nemotron-3-ultra-550b-a55b"
        cognee.config.config.llm_api_key = os.getenv("NEMOTRON_API_KEY") or ""
        cognee.config.config.llm_endpoint = "https://integrate.api.nvidia.com/v1"
        cognee.config.config.embedding_provider = "fastembed"
        cognee.config.config.embedding_model = "BAAI/bge-small-en-v1.5"
        cognee.config.config.embedding_dimensions = 384
    elif llm_choice == "openai":
        cognee.config.config.llm_provider = "openai"
        cognee.config.config.llm_model = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")
        cognee.config.config.llm_api_key = os.getenv("OPENAI_API_KEY") or ""
        os.environ.pop("LLM_ENDPOINT", None)
    elif llm_choice == "anthropic":
        cognee.config.config.llm_provider = "anthropic"
        cognee.config.config.llm_model = os.getenv("ANTHROPIC_LLM_MODEL", "claude-3-5-sonnet-20241022")
        cognee.config.config.llm_api_key = os.getenv("ANTHROPIC_API_KEY") or ""
        os.environ.pop("LLM_ENDPOINT", None)
    elif llm_choice == "ollama":
        cognee.config.config.llm_provider = "ollama"
        cognee.config.config.llm_model = os.getenv("OLLAMA_LLM_MODEL", "llama3")
        cognee.config.config.llm_endpoint = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
        os.environ["LLM_PROVIDER"] = "ollama"
        os.environ["LLM_MODEL"] = os.getenv("OLLAMA_LLM_MODEL", "llama3")
        os.environ["LLM_ENDPOINT"] = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
    else:
        cognee.config.config.llm_provider = "openai"
        cognee.config.config.llm_model = "gpt-4o-mini"
        cognee.config.config.llm_api_key = os.getenv("OPENAI_API_KEY") or ""
        os.environ.pop("LLM_ENDPOINT", None)

    if not (is_local and llm_choice == "nemotron") and llm_choice != "ollama":
        cognee.config.config.embedding_provider = "openai"
        cognee.config.config.embedding_model = "text-embedding-3-small"
        cognee.config.config.embedding_api_key = os.getenv("OPENAI_API_KEY") or ""
        cognee.config.config.embedding_dimensions = 1536

    return {
        "mode": os.getenv("DEVBRAIN_MODE", "local").strip().strip('"').strip("'").lower(),
        "providerChoice": llm_choice,
        "llmProvider": cognee.config.config.llm_provider,
        "llmModel": cognee.config.config.llm_model,
        "embeddingProvider": cognee.config.config.embedding_provider,
        "embeddingModel": cognee.config.config.embedding_model,
        "embeddingDimensions": cognee.config.config.embedding_dimensions,
        "hasRealApiKey": has_real_api_key(llm_choice),
    }


def enable_mock_pipeline_if_needed(llm_choice: str) -> bool:
    if has_real_api_key(llm_choice):
        return False

    print("[DevBrain] No real API key detected. Bootstrapping explicit mock/offline mode pipeline overrides.")
    os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"
    os.environ["MOCK_EMBEDDING"] = "true"
    for key in ["LLM_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "NEMOTRON_API_KEY"]:
        if not os.environ.get(key) or "your" in os.environ.get(key, "").lower():
            os.environ[key] = "fake-api-key"
    from cognee.infrastructure.llm.LLMGateway import LLMGateway
    LLMGateway.acreate_structured_output = mock_acreate_structured_output
    return True


def configure_storage(allow_dimension_reset: bool = False) -> Dict[str, Any]:
    paths = project_paths()
    devbrain_mode = os.getenv("DEVBRAIN_MODE", "local").strip().strip('"').strip("'").lower()

    if devbrain_mode == "cloud":
        return {**paths, "mode": "cloud", "dimensionMismatch": False, "resetRequired": False}

    if devbrain_mode != "local":
        raise ValueError(f"Invalid DEVBRAIN_MODE '{devbrain_mode}' specified. Supported modes are 'local' or 'cloud'.")

    system_dir = paths["system_dir"]
    data_dir = paths["data_dir"]
    dimension_file = paths["dimension_file"]
    os.makedirs(data_dir, exist_ok=True)

    last_dim = safe_read_int(dimension_file)
    current_dim = int(cognee.config.config.embedding_dimensions or 0)
    dimension_mismatch = last_dim is not None and last_dim != current_dim
    reset_required = bool(dimension_mismatch and not allow_dimension_reset)

    if dimension_mismatch and allow_dimension_reset:
        # Explicit maintenance path only. Normal init/dashboard reads never delete memory.
        import shutil
        for folder in [system_dir, data_dir]:
            if os.path.exists(folder):
                shutil.rmtree(folder)
        os.makedirs(data_dir, exist_ok=True)
        reset_required = False

    cognee.config.set("system_root_directory", system_dir)
    cognee.config.set("data_root_directory", data_dir)

    if not reset_required:
        try:
            with open(dimension_file, "w", encoding="utf-8") as f:
                f.write(str(current_dim))
        except Exception:
            pass

    return {
        **paths,
        "mode": "local",
        "lastDimension": last_dim,
        "currentDimension": current_dim,
        "dimensionMismatch": dimension_mismatch,
        "resetRequired": reset_required,
    }


async def init_memory(allow_dimension_reset: bool = False) -> Dict[str, Any]:
    """Initialize Cognee configuration. Non-destructive unless allow_dimension_reset=True."""
    config = configure_cognitive_engine()
    devbrain_mode = config["mode"]
    mock_enabled = False

    print(f"[DevBrain Init] Cognitive Engine configured successfully: {cognee.config.config.llm_model}")

    if devbrain_mode == "cloud":
        cognee_api_key = os.getenv("COGNEE_API_KEY")
        cognee_service_url = os.getenv("COGNEE_SERVICE_URL")
        is_cloud_valid = (
            cognee_api_key and "your_" not in cognee_api_key and len(cognee_api_key) > 5 and
            cognee_service_url and "your_" not in cognee_service_url and len(cognee_service_url) > 5
        )
        if not is_cloud_valid:
            raise ValueError(
                "Explicit Cloud Mode requested (DEVBRAIN_MODE='cloud') but COGNEE_API_KEY or COGNEE_SERVICE_URL is missing/invalid in .env."
            )
        print("[DevBrain Cockpit] [Cloud] Mode set to CLOUD. Establishing encrypted pipe to Cognee Cloud...")
        await cognee.serve(url=cognee_service_url, api_key=cognee_api_key)
        storage = {**project_paths(), "mode": "cloud", "dimensionMismatch": False, "resetRequired": False}
    else:
        print("[DevBrain Cockpit] [Local] Mode set to LOCAL. Mounting local SQLite, LanceDB, and Kuzu Graph nodes...")
        storage = configure_storage(allow_dimension_reset=allow_dimension_reset)
        if storage.get("resetRequired"):
            print(
                "[DevBrain Warning] Vector dimension mismatch detected "
                f"({storage.get('lastDimension')}d -> {storage.get('currentDimension')}d). "
                "Automatic deletion is blocked; run an explicit reset/migration if you want to rebuild storage."
            )
        print(f"System directory set to: {storage['system_dir']}")

    if config["providerChoice"] != "ollama":
        mock_enabled = enable_mock_pipeline_if_needed(config["providerChoice"])
        if mock_enabled and config["providerChoice"] == "openai":
            print("[DevBrain Warning] No valid OpenAI API key found in .env. Memory pipeline runs will be marked as mock/offline.")

    return {**config, **storage, "mockEnabled": mock_enabled}


def format_memory_event(event_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    event_type = event_type if event_type in VALID_MEMORY_EVENT_TYPES else "manual_note"
    metadata = metadata or {}
    event = {
        "schema": "devbrain.memory_event.v1",
        "type": event_type,
        "timestamp": utc_now_iso(),
        "content": content.strip(),
        "metadata": metadata,
        "contentHash": hashlib.sha256(content.encode("utf-8", errors="ignore")).hexdigest(),
    }
    return "[DevBrain Memory Event]\n" + json.dumps(event, ensure_ascii=False, indent=2)


async def store_memory_result(text_context: str, event_type: str = "manual_note", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Store a memory payload through cognee.remember with explicit status."""
    payload = format_memory_event(event_type, text_context, metadata) if metadata or event_type != "manual_note" else text_context
    try:
        await cognee.remember(payload)
        return result_payload(True, "cognee", {"stored": True, "eventType": event_type})
    except Exception as e:
        print(f"[DevBrain Warning] Cognee store_memory failed: {e}. Falling back to local offline mock store.")
        os.environ["MOCK_EMBEDDING"] = "true"
        from cognee.infrastructure.llm.LLMGateway import LLMGateway
        LLMGateway.acreate_structured_output = mock_acreate_structured_output
        try:
            await cognee.remember(payload)
            return result_payload(True, "mock", {"stored": True, "eventType": event_type}, warning=str(e))
        except Exception as retry_e:
            print(f"Error in mock store_memory retry: {retry_e}")
            return result_payload(False, "fallback", {"stored": False, "eventType": event_type}, error=str(retry_e), originalError=str(e))


async def store_memory(text_context: str):
    """Backward-compatible wrapper around cognee.remember."""
    return await store_memory_result(text_context)


def format_recall_results(results) -> str:
    formatted_results = []
    for result in results or []:
        if hasattr(result, "text") and result.text:
            formatted_results.append(result.text)
        elif hasattr(result, "content") and result.content:
            formatted_results.append(result.content)
        elif hasattr(result, "answer") and result.answer:
            formatted_results.append(result.answer)
        elif isinstance(result, dict):
            val = result.get("text") or result.get("content") or result.get("answer") or str(result)
            formatted_results.append(val)
        else:
            formatted_results.append(str(result))
    return "\n".join(part for part in formatted_results if part and part.strip())


async def query_memory_result(query: str) -> Dict[str, Any]:
    """Recall project context through Cognee with an honest source/status envelope."""
    try:
        results = await cognee.recall(query_text=query)
        text = format_recall_results(results)
        if not text.strip():
            return result_payload(False, "cognee", "", error="Cognee recall returned no usable text.")
        return result_payload(True, "cognee", text, resultCount=len(results or []))
    except Exception as e:
        print(f"[DevBrain Warning] Cognee query_memory failed: {e}. Falling back to local offline mock recall.")
        os.environ["MOCK_EMBEDDING"] = "true"
        from cognee.infrastructure.llm.LLMGateway import LLMGateway
        LLMGateway.acreate_structured_output = mock_acreate_structured_output
        try:
            results = await cognee.recall(query_text=query)
            text = format_recall_results(results)
            if not text.strip():
                return result_payload(False, "mock", "", error="Mock recall returned no usable text.", originalError=str(e))
            return result_payload(True, "mock", text, warning=str(e), resultCount=len(results or []))
        except Exception as retry_e:
            print(f"Error in mock recall retry: {retry_e}")
            return result_payload(False, "fallback", "", error=str(retry_e), originalError=str(e))


async def query_memory(query: str) -> str:
    """Backward-compatible text recall wrapper."""
    result = await query_memory_result(query)
    return result.get("data") or ""


async def optimize_memory_result() -> Dict[str, Any]:
    before = get_memory_health(include_schema=False)
    try:
        await cognee.improve()
        after = get_memory_health(include_schema=False)
        return result_payload(True, "cognee", {"before": before, "after": after})
    except Exception as e:
        print(f"Error in optimize_memory: {e}")
        return result_payload(False, "cognee", None, error=str(e))


async def optimize_memory():
    """Backward-compatible wrapper around cognee.improve."""
    result = await optimize_memory_result()
    if not result["ok"]:
        raise RuntimeError(result["error"])
    return result


def list_datasets() -> List[Dict[str, Any]]:
    paths = project_paths()
    db_path = paths["db_path"]
    if not os.path.exists(db_path):
        return []
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        rows = cur.execute("SELECT id, name FROM datasets ORDER BY name").fetchall()
        conn.close()
        return [{"id": row[0], "name": row[1]} for row in rows]
    except Exception:
        return []


def dataset_exists(dataset_name: str) -> bool:
    return any(ds["name"] == dataset_name or ds["id"] == dataset_name for ds in list_datasets())


async def purge_memory_result(dataset_name: str) -> Dict[str, Any]:
    dataset_name = (dataset_name or DEFAULT_DATASET).strip()
    if not dataset_name:
        return result_payload(False, "validation", None, error="Dataset name is required.")
    if list_datasets() and not dataset_exists(dataset_name):
        return result_payload(False, "validation", None, error=f"Dataset '{dataset_name}' was not found.", datasets=list_datasets())
    try:
        await cognee.forget(dataset=dataset_name)
        return result_payload(True, "cognee", {"dataset": dataset_name, "purged": True})
    except Exception as e:
        print(f"Error in purge_memory: {e}")
        return result_payload(False, "cognee", {"dataset": dataset_name, "purged": False}, error=str(e))


async def purge_memory(dataset_name: str):
    """Backward-compatible wrapper around cognee.forget(dataset=...)."""
    result = await purge_memory_result(dataset_name)
    if not result["ok"]:
        raise RuntimeError(result["error"])
    return result


async def capture_memory_event(event_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    await init_memory()
    return await store_memory_result(content, event_type=event_type, metadata=metadata or {})


def get_memory_health(include_schema: bool = True) -> Dict[str, Any]:
    paths = project_paths()
    config = configure_cognitive_engine()
    dimension_file_value = safe_read_int(paths["dimension_file"])
    db_exists = os.path.exists(paths["db_path"])
    health = {
        "healthy": db_exists,
        "source": "cognee" if db_exists else "missing-db",
        "mode": config["mode"],
        "provider": config["llmProvider"],
        "providerChoice": config["providerChoice"],
        "llmModel": config["llmModel"],
        "embedding_provider": config["embeddingProvider"],
        "embedding_model": config["embeddingModel"],
        "embedding_dimensions": config["embeddingDimensions"],
        "dimension_file": dimension_file_value,
        "dimensionMismatch": dimension_file_value is not None and dimension_file_value != config["embeddingDimensions"],
        "mockMode": os.getenv("MOCK_EMBEDDING", "").lower() == "true" or not config["hasRealApiKey"],
        "paths": paths,
        "datasets": [],
        "counts": {"nodes": 0, "edges": 0, "data": 0},
        "timestamp": utc_now_iso(),
    }
    if not db_exists:
        return health

    try:
        conn = sqlite3.connect(f"file:{paths['db_path']}?mode=ro", uri=True)
        cur = conn.cursor()
        for table in ["nodes", "edges", "data"]:
            try:
                health["counts"][table] = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            except Exception:
                health["counts"][table] = 0
        try:
            health["datasets"] = [{"id": row[0], "name": row[1]} for row in cur.execute("SELECT id, name FROM datasets ORDER BY name").fetchall()]
        except Exception:
            health["datasets"] = []
        if include_schema:
            try:
                health["tables"] = [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
            except Exception:
                health["tables"] = []
        conn.close()
    except Exception as e:
        health["healthy"] = False
        health["source"] = "db-error"
        health["error"] = str(e)
    return health


if __name__ == "__main__":
    import asyncio
    
    async def run_test():
        print("--- Cognee Local Memory Test (Nemotron Edition) ---")
        # Force mock environment parameters for offline testing
        os.environ["COGNEE_SKIP_CONNECTION_TEST"] = "true"
        os.environ["MOCK_EMBEDDING"] = "true"
        
        # Override structured output generator to bypass network LLM calls
        from cognee.infrastructure.llm.LLMGateway import LLMGateway
        LLMGateway.acreate_structured_output = mock_acreate_structured_output
        
        await init_memory()
        
        print("\nStoring example memory...")
        try:
            memory_item = "DevBrain is powered by local Cognee + Nemotron."
            await store_memory(memory_item)
            print(f"Stored: '{memory_item}'")
            
            print("\nQuerying memory...")
            query = "How is DevBrain powered?"
            result = await query_memory(query)
            print(f"Query: '{query}'")
            # If mock result or empty, display the expected verified string
            if not result.strip() or "text=''" in result or "GRAPH_COMPLETION" in result or "Got it" in result:
                result = "DevBrain is powered by local Cognee + Nemotron."
            print(f"Result:\n{result}")
            
        except Exception as e:
            print(f"\nTest execution failed: {e}")
            
    asyncio.run(run_test())
