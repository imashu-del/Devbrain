import asyncio
import contextlib
import json
import sys
from typing import Any, Dict

import devbrain_core

TOOLS = [
    {
        "name": "devbrain_capture_reasoning",
        "description": "Store an answer, explanation, architectural decision, migration reason, or tool session summary in DevBrain memory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "default": "manual_note"},
                "content": {"type": "string"},
                "metadata": {"type": "object"},
            },
            "required": ["content"],
        },
    },
    {
        "name": "devbrain_recall_context",
        "description": "Recall relevant project memory from Cognee for a given task or question.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "devbrain_health",
        "description": "Return Cognee memory status, provider settings, datasets, and graph counts.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "devbrain_list_datasets",
        "description": "List Cognee datasets known to DevBrain.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "devbrain_optimize_memory",
        "description": "Run Cognee improve() and return before/after health counts.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def respond(message_id: Any, result: Dict[str, Any] = None, error: Dict[str, Any] = None):
    payload = {"jsonrpc": "2.0", "id": message_id}
    if error is not None:
        payload["error"] = error
    else:
        payload["result"] = result or {}
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def notify(method: str, params: Dict[str, Any] = None):
    sys.stdout.write(json.dumps({"jsonrpc": "2.0", "method": method, "params": params or {}}, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def content_result(data: Any):
    return {"content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False, indent=2)}]}


async def call_tool(name: str, args: Dict[str, Any]):
    with contextlib.redirect_stdout(sys.stderr):
        return await call_tool_inner(name, args)


async def call_tool_inner(name: str, args: Dict[str, Any]):
    if name == "devbrain_capture_reasoning":
        return await devbrain_core.capture_memory_event(
            args.get("type", "manual_note"),
            args.get("content", ""),
            args.get("metadata") or {"source": "mcp"},
        )
    if name == "devbrain_recall_context":
        await devbrain_core.init_memory()
        return await devbrain_core.query_memory_result(args.get("query", ""))
    if name == "devbrain_health":
        return {"ok": True, "data": devbrain_core.get_memory_health()}
    if name == "devbrain_list_datasets":
        return {"ok": True, "data": devbrain_core.list_datasets()}
    if name == "devbrain_optimize_memory":
        await devbrain_core.init_memory()
        return await devbrain_core.optimize_memory_result()
    return {"ok": False, "error": f"Unknown tool: {name}"}


async def handle(message: Dict[str, Any]):
    method = message.get("method")
    message_id = message.get("id")
    params = message.get("params") or {}

    try:
        if method == "initialize":
            respond(message_id, {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "devbrain", "version": "0.1.0"},
                "capabilities": {"tools": {}},
            })
        elif method == "notifications/initialized":
            return
        elif method == "tools/list":
            respond(message_id, {"tools": TOOLS})
        elif method == "tools/call":
            result = await call_tool(params.get("name"), params.get("arguments") or {})
            respond(message_id, content_result(result))
        else:
            respond(message_id, error={"code": -32601, "message": f"Method not found: {method}"})
    except Exception as exc:
        respond(message_id, error={"code": -32000, "message": str(exc)})


def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError as exc:
            respond(None, error={"code": -32700, "message": str(exc)})
            continue
        asyncio.run(handle(message))


if __name__ == "__main__":
    main()
