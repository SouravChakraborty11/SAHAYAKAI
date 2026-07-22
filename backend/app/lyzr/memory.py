from typing import Dict, Any

class MemoryStore:
    def __init__(self):
        # In-memory dictionary: session_id -> context dict
        self._store: Dict[str, Dict[str, Any]] = {}

    def get_context(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self._store:
            self._store[session_id] = {
                "history": [],
                "user_context": {},
                "active_task": None
            }
        return self._store[session_id]

    def update_context(self, session_id: str, updates: Dict[str, Any]):
        context = self.get_context(session_id)
        context.update(updates)

    def add_message(self, session_id: str, sender: str, message: str):
        context = self.get_context(session_id)
        # Keep only the last 10 messages for lightweight operation in Phase 11
        if len(context["history"]) > 10:
            context["history"] = context["history"][-10:]
        context["history"].append({"sender": sender, "message": message})

# Singleton memory store
memory = MemoryStore()
