"""Sequential Task Queue for WINC AI OS - Low RAM Multiagent Orchestration."""

import asyncio
import time
import uuid
import logging
from typing import Dict, Any, Optional
from .database import get_db_connection, log_audit
from .engine_manager import engine_manager
from .agent_adapter import get_agent_by_id

logger = logging.getLogger(__name__)

class SequentialTaskQueue:
    """FIFO queue that ensures only 1 task runs at any time on 4GB RAM machines."""

    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
        self.current_task_id: Optional[str] = None
        self._worker_task: Optional[asyncio.Task] = None

    def start_worker(self):
        """Start background queue consumer."""
        if self._worker_task is None or self._worker_task.done():
            self.is_running = True
            self._worker_task = asyncio.create_task(self._process_queue())

    async def enqueue_task(self, project_id: Optional[str], agent_id: str, title: str, description: str, priority: int = 1) -> str:
        """Add a task to SQLite and memory queue."""
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        now = time.time()

        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO tasks (
                    id, project_id, agent_id, title, description,
                    status, priority, stage, logs, result, created_at
                ) VALUES (?, ?, ?, ?, ?, 'pending', ?, 'pending', '', '', ?)
            """, (task_id, project_id, agent_id, title, description, priority, now))
            conn.commit()

        await self.queue.put(task_id)
        log_audit("TASK_ENQUEUED", "system", f"Enqueued task {task_id} for agent {agent_id}")
        return task_id

    async def _process_queue(self):
        """Worker loop executing tasks strictly one-by-one."""
        while self.is_running:
            try:
                task_id = await self.queue.get()
                self.current_task_id = task_id
                await self._execute_single_task(task_id)
                self.queue.task_done()
                self.current_task_id = None
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in task queue worker: {e}")
                await asyncio.sleep(1)

    async def _execute_single_task(self, task_id: str):
        """Run single task through the assigned agent with OpenJarvis / Engine manager."""
        now = time.time()
        with get_db_connection() as conn:
            row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
            if not row:
                return
            task = dict(row)

            # Update status to running
            conn.execute("UPDATE tasks SET status = 'running', stage = 'execution', started_at = ? WHERE id = ?", (now, task_id))
            conn.commit()

        agent = get_agent_by_id(task["agent_id"])
        system_prompt = agent["system_prompt"] if agent else "You are a professional AI agent."

        try:
            # Execute inference via low RAM manager (holding INFERENCE_LOCK)
            result = await engine_manager.generate_response(
                system_prompt=system_prompt,
                user_prompt=f"Execute the following task:\nTitle: {task['title']}\nDetails: {task['description']}"
            )

            completed_at = time.time()
            with get_db_connection() as conn:
                conn.execute("""
                    UPDATE tasks
                    SET status = 'completed', stage = 'done', result = ?, logs = ?, completed_at = ?
                    WHERE id = ?
                """, (result, f"Executed in {completed_at - now:.2f}s via single-agent lock.", completed_at, task_id))
                conn.commit()

            log_audit("TASK_COMPLETED", task["agent_id"], f"Completed task {task_id}")
        except Exception as ex:
            logger.error(f"Failed task {task_id}: {ex}")
            with get_db_connection() as conn:
                conn.execute("""
                    UPDATE tasks
                    SET status = 'error', stage = 'done', result = ?, logs = ?, completed_at = ?
                    WHERE id = ?
                """, (f"Error: {str(ex)}", "Execution interrupted.", time.time(), task_id))
                conn.commit()

# Global singleton task queue
task_queue = SequentialTaskQueue()
