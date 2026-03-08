"""
Seed pipeline schedule data (workflow_templates + workflow_steps) into the database.
Run from Backend with:
  python scripts/seed_pipeline_schedules.py
  or: python -m scripts.seed_pipeline_schedules
Requires SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.
"""
import os
import sys

# Ensure app is importable and load .env
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    load_dotenv(env_path)
except Exception:
    pass

from datetime import datetime, timezone

# Pipeline schedule dataset: one template per stage with default steps
PIPELINE_SCHEDULE_DATA = [
    {
        "stage_name": "q1",
        "description": "Q1 (271+ days to renewal)",
        "steps": [
            {"step_order": 1, "title": "Early check-in", "time_label": "Month 1", "days_offset": 30, "action_type": "email", "topic": "Renewal check and health", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
            {"step_order": 2, "title": "Satisfaction call", "time_label": "Month 2", "days_offset": 60, "action_type": "call", "topic": "Check satisfaction and usage", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 5, "is_active": True},
            {"step_order": 3, "title": "Renewal reminder", "time_label": "Month 3", "days_offset": 90, "action_type": "email", "topic": "Renewal reminder and next steps", "frequency": "monthly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
        ],
    },
    {
        "stage_name": "q2",
        "description": "Q2 (181-270 days to renewal)",
        "steps": [
            {"step_order": 1, "title": "Quarterly touchpoint", "time_label": "Month 4", "days_offset": 30, "action_type": "email", "topic": "Quarterly review and renewal timeline", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
            {"step_order": 2, "title": "Usage review call", "time_label": "Month 5", "days_offset": 60, "action_type": "call", "topic": "Usage review and expansion", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 5, "is_active": True},
            {"step_order": 3, "title": "Renewal prep", "time_label": "Month 6", "days_offset": 90, "action_type": "email", "topic": "Renewal preparation and options", "frequency": "monthly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
        ],
    },
    {
        "stage_name": "q3",
        "description": "Q3 (91-180 days to renewal)",
        "steps": [
            {"step_order": 1, "title": "Renewal timeline", "time_label": "Month 7", "days_offset": 30, "action_type": "email", "topic": "Renewal timeline and key dates", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
            {"step_order": 2, "title": "Stakeholder call", "time_label": "Month 8", "days_offset": 60, "action_type": "call", "topic": "Stakeholder alignment and renewal discussion", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 5, "is_active": True},
            {"step_order": 3, "title": "Last 90 days", "time_label": "Month 9", "days_offset": 90, "action_type": "email", "topic": "Final quarter renewal focus", "frequency": "monthly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
        ],
    },
    {
        "stage_name": "q4",
        "description": "Q4 (0-90 days to renewal)",
        "steps": [
            {"step_order": 1, "title": "Last 30 days", "time_label": "Last 30 days", "days_offset": 30, "action_type": "email", "topic": "Urgent renewal reminder - 30 days left", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 2, "is_active": True},
            {"step_order": 2, "title": "Final call", "time_label": "Last 15 days", "days_offset": 15, "action_type": "call", "topic": "Final renewal call and close", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
            {"step_order": 3, "title": "Last 3 days", "time_label": "Last 3 days", "days_offset": 3, "action_type": "email", "topic": "Final reminder before renewal date", "frequency": "daily", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 1, "is_active": True},
        ],
    },
    {
        "stage_name": "no_renewed",
        "description": "No Renewed (past due, not renewed)",
        "steps": [
            {"step_order": 1, "title": "Overdue follow-up", "time_label": "1 week overdue", "days_offset": 7, "action_type": "email", "topic": "Urgent: renewal date passed - follow up", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 2, "is_active": True},
            {"step_order": 2, "title": "Recovery call", "time_label": "2 weeks overdue", "days_offset": 14, "action_type": "call", "topic": "Recovery call - renew or close", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 3, "is_active": True},
        ],
    },
    {
        "stage_name": "renewed",
        "description": "Renewed",
        "steps": [
            {"step_order": 1, "title": "Thank you", "time_label": "Month 1", "days_offset": 7, "action_type": "email", "topic": "Thank you for renewing", "frequency": "weekly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 7, "is_active": True},
            {"step_order": 2, "title": "Success check-in", "time_label": "Month 2", "days_offset": 30, "action_type": "call", "topic": "Post-renewal success check-in", "frequency": "monthly", "send_window_start": "09:00", "send_window_end": "17:00", "follow_up_offset_days": 14, "is_active": True},
        ],
    },
]


def get_client():
    from supabase import create_client
    from app.core.config import settings
    url = os.getenv("SUPABASE_URL") or getattr(settings, "SUPABASE_URL", None)
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
        or os.getenv("SUPABASE_KEY")
        or getattr(settings, "SUPABASE_KEY", None)
    )
    if not url or not key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env")
    return create_client(url, key)


def seed():
    client = get_client()
    for stage_data in PIPELINE_SCHEDULE_DATA:
        stage_name = stage_data["stage_name"]
        description = stage_data["description"]
        steps_data = stage_data["steps"]
        # Upsert template (insert or ignore if exists)
        try:
            existing = client.table("workflow_templates").select("id").eq("stage_name", stage_name).limit(1).execute()
            if existing.data and len(existing.data) > 0:
                template_id = existing.data[0]["id"]
                print(f"Template '{stage_name}' exists (id={template_id}); skipping insert.")
            else:
                ins = client.table("workflow_templates").insert({
                    "stage_name": stage_name,
                    "description": description,
                }).execute()
                if not ins.data or len(ins.data) == 0:
                    print(f"Failed to insert template '{stage_name}'")
                    continue
                template_id = ins.data[0]["id"]
                print(f"Inserted template '{stage_name}' (id={template_id})")
        except Exception as e:
            print(f"Error on template '{stage_name}': {e}")
            continue
        # Insert steps (delete existing steps for this template so we replace with seed data)
        try:
            client.table("workflow_steps").delete().eq("template_id", template_id).execute()
        except Exception:
            pass
        for step in steps_data:
            try:
                row = {
                    "template_id": template_id,
                    "step_order": step["step_order"],
                    "title": step["title"],
                    "time_label": step["time_label"],
                    "days_offset": step["days_offset"],
                    "action_type": step["action_type"],
                    "topic": step["topic"],
                    "frequency": step["frequency"],
                    "send_window_start": step.get("send_window_start"),
                    "send_window_end": step.get("send_window_end"),
                    "follow_up_offset_days": step.get("follow_up_offset_days", 3),
                    "is_active": step.get("is_active", True),
                }
                client.table("workflow_steps").insert(row).execute()
            except Exception as e:
                print(f"  Step '{step['title']}' failed: {e}")
        print(f"  Inserted {len(steps_data)} steps for '{stage_name}'")
    print("Pipeline schedule seed done.")


if __name__ == "__main__":
    seed()
