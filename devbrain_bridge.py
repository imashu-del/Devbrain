import argparse
import asyncio
import contextlib
import json
import sys

import devbrain_core


def emit(payload, status=0):
    print(json.dumps(payload, ensure_ascii=False))
    raise SystemExit(status)


async def run(args):
    with contextlib.redirect_stdout(sys.stderr):
        payload = await run_inner(args)
    emit(payload, 0 if payload.get("ok", False) else 1)


async def run_inner(args):
    if args.command == "health":
        return {"ok": True, "data": devbrain_core.get_memory_health()}

    if args.command == "datasets":
        return {"ok": True, "data": devbrain_core.list_datasets()}

    if args.command == "optimize":
        await devbrain_core.init_memory()
        return await devbrain_core.optimize_memory_result()

    if args.command == "purge":
        await devbrain_core.init_memory()
        return await devbrain_core.purge_memory_result(args.dataset)

    if args.command == "capture":
        metadata = json.loads(args.metadata) if args.metadata else {}
        return await devbrain_core.capture_memory_event(args.type, args.content, metadata)

    if args.command == "recall":
        await devbrain_core.init_memory()
        return await devbrain_core.query_memory_result(args.query)

    return {"ok": False, "error": f"Unknown command {args.command}"}


def main():
    parser = argparse.ArgumentParser(description="DevBrain JSON command bridge")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("health")
    sub.add_parser("datasets")
    sub.add_parser("optimize")
    purge = sub.add_parser("purge")
    purge.add_argument("--dataset", default=devbrain_core.DEFAULT_DATASET)
    capture = sub.add_parser("capture")
    capture.add_argument("--type", default="manual_note")
    capture.add_argument("--content", required=True)
    capture.add_argument("--metadata", default="{}")
    recall = sub.add_parser("recall")
    recall.add_argument("--query", required=True)
    args = parser.parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}), file=sys.stdout)
        raise SystemExit(1)
