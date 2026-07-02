import json
import os
import unittest

import devbrain_core


class DevBrainCoreTests(unittest.TestCase):
    def test_memory_event_format_is_structured(self):
        payload = devbrain_core.format_memory_event(
            "architecture_decision",
            "Use MCP as the explicit AI-agent memory bridge.",
            {"source": "test"},
        )
        self.assertTrue(payload.startswith("[DevBrain Memory Event]"))
        event = json.loads(payload.split("\n", 1)[1])
        self.assertEqual(event["schema"], "devbrain.memory_event.v1")
        self.assertEqual(event["type"], "architecture_decision")
        self.assertEqual(event["metadata"]["source"], "test")
        self.assertIn("contentHash", event)

    def test_invalid_memory_event_type_falls_back_to_manual_note(self):
        payload = devbrain_core.format_memory_event("not_real", "hello", {})
        event = json.loads(payload.split("\n", 1)[1])
        self.assertEqual(event["type"], "manual_note")

    def test_result_payload_marks_fallback_sources(self):
        payload = devbrain_core.result_payload(True, "mock", {"stored": True})
        self.assertTrue(payload["fallbackUsed"])
        self.assertEqual(payload["source"], "mock")

    def test_project_paths_are_absolute(self):
        paths = devbrain_core.project_paths()
        self.assertTrue(os.path.isabs(paths["workspace"]))
        self.assertTrue(os.path.isabs(paths["system_dir"]))
        self.assertTrue(os.path.isabs(paths["data_dir"]))
        self.assertTrue(paths["db_path"].endswith(os.path.join(".cognee_system", "databases", "cognee_db")))

    def test_health_shape_is_stable(self):
        health = devbrain_core.get_memory_health(include_schema=False)
        self.assertIn("healthy", health)
        self.assertIn("counts", health)
        self.assertIn("datasets", health)
        self.assertIn("embedding_dimensions", health)
        self.assertIn("dimensionMismatch", health)


if __name__ == "__main__":
    unittest.main()
