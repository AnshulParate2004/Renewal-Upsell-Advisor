#!/usr/bin/env python3
"""Seed dev tenant, admin user, and sample accounts."""
import asyncio
import json
from datetime import date, timedelta
from pathlib import Path

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.entities import Account, AppSettings, Role, Tenant, User, UserRole
from app.services.llm.config import DEFAULT_LLM_ROUTING
from app.services.scoring.config import DEFAULT_LIFECYCLE_BUCKETS, DEFAULT_SCORING_CONFIG

SCORING_JSON = Path(__file__).resolve().parents[1] / "schemas" / "scoring_config.example.json"
LLM_JSON = Path(__file__).resolve().parents[1] / "schemas" / "llm_config.example.json"


async def seed():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant).where(Tenant.slug == "demo"))
        tenant = result.scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name="Demo Tenant", slug="demo")
            db.add(tenant)
            await db.flush()

        result = await db.execute(select(User).where(User.email == "admin@demo.local"))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                tenant_id=tenant.id,
                email="admin@demo.local",
                password_hash=hash_password("admin123"),
                full_name="Demo Admin",
            )
            db.add(user)
            await db.flush()
            role = Role(tenant_id=tenant.id, name="admin")
            db.add(role)
            await db.flush()
            db.add(UserRole(user_id=user.id, role_id=role.id))

        result = await db.execute(
            select(AppSettings).where(AppSettings.tenant_id == tenant.id, AppSettings.config_key == "default")
        )
        if not result.scalar_one_or_none():
            scoring = json.loads(SCORING_JSON.read_text(encoding="utf-8")) if SCORING_JSON.exists() else DEFAULT_SCORING_CONFIG.model_dump()
            llm_raw = json.loads(LLM_JSON.read_text(encoding="utf-8")) if LLM_JSON.exists() else DEFAULT_LLM_ROUTING.model_dump()
            llm_raw.pop("_comment", None)
            db.add(
                AppSettings(
                    tenant_id=tenant.id,
                    config_key="default",
                    config={
                        "lifecycle_buckets": DEFAULT_LIFECYCLE_BUCKETS.model_dump(),
                        "scoring_formulas": scoring,
                        "llm_routing": llm_raw,
                    },
                )
            )

        result = await db.execute(select(Account).where(Account.tenant_id == tenant.id))
        if not result.scalars().first():
            today = date.today()
            samples = [
                Account(
                    tenant_id=tenant.id,
                    name="Acme Corp",
                    arr=120000,
                    renewal_date=today + timedelta(days=45),
                    contract_start_date=today - timedelta(days=200),
                    licenses_total=100,
                    licenses_used=78,
                    utilization_percentage=78,
                    status="active",
                ),
                Account(
                    tenant_id=tenant.id,
                    name="Beta Industries",
                    arr=85000,
                    renewal_date=today + timedelta(days=200),
                    contract_start_date=today - timedelta(days=30),
                    licenses_total=50,
                    licenses_used=15,
                    utilization_percentage=30,
                    status="active",
                ),
                Account(
                    tenant_id=tenant.id,
                    name="Gamma LLC",
                    arr=45000,
                    renewal_date=today + timedelta(days=20),
                    contract_start_date=today - timedelta(days=400),
                    licenses_total=40,
                    licenses_used=10,
                    utilization_percentage=25,
                    status="at_risk",
                ),
            ]
            db.add_all(samples)

        await db.commit()
        print("Seed complete: admin@demo.local / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
