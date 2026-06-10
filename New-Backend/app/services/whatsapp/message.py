"""WhatsApp message generation via LiteLLM."""
from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.llm.router import ainvoke


async def generate_whatsapp_message(
    *,
    topic: str,
    account_name: str = "",
    tenant_id: UUID | None = None,
    db: AsyncSession | None = None,
) -> str:
    return await ainvoke(
        [
            {
                "role": "user",
                "content": (
                    f"Write a short WhatsApp message for customer '{account_name}'. "
                    f"Purpose: {topic}. Max 300 characters, friendly tone."
                ),
            }
        ],
        task="whatsapp_message",
        tenant_id=tenant_id,
        db=db,
    )
