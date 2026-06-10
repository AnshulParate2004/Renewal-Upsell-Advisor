"""Workflow step evaluator — IST send window and channel dispatch."""
from __future__ import annotations

from datetime import datetime

import pytz

IST = pytz.timezone("Asia/Kolkata")


def within_send_window(start, end, now: datetime | None = None) -> bool:
    now = now or datetime.now(IST)
    if start is None or end is None:
        return True
    t = now.time()
    return start <= t <= end if start <= end else (t >= start or t <= end)
