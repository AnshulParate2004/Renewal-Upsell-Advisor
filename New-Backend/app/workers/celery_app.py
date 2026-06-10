"""Celery application and beat schedule."""
from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "revenue_navigator",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.task_routes = {
    "app.workers.tasks.scoring_*": {"queue": "scoring"},
    "app.workers.tasks.lifecycle_*": {"queue": "scoring"},
    "app.workers.tasks.workflow_*": {"queue": "workflows"},
    "app.workers.tasks.campaign_*": {"queue": "campaigns"},
    "app.workers.tasks.email_*": {"queue": "email"},
    "app.workers.tasks.voice_*": {"queue": "voice"},
    "app.workers.tasks.integration_*": {"queue": "integrations"},
    "app.workers.tasks.analytics_*": {"queue": "analytics"},
    "app.workers.tasks.mongo_*": {"queue": "maintenance"},
    "app.workers.tasks.redis_*": {"queue": "analytics"},
}

celery_app.conf.beat_schedule = {
    "scoring_daily": {
        "task": "app.workers.tasks.scoring_daily",
        "schedule": crontab(hour=0, minute=0),
    },
    "scoring_incremental": {
        "task": "app.workers.tasks.scoring_incremental",
        "schedule": crontab(minute="*/6"),
    },
    "lifecycle_reclassify": {
        "task": "app.workers.tasks.lifecycle_reclassify",
        "schedule": crontab(minute="*/6", hour="1-23"),
    },
    "workflow_step_evaluator": {
        "task": "app.workers.tasks.workflow_step_evaluator",
        "schedule": crontab(minute="*/5"),
    },
    "workflow_enrollment_sync": {
        "task": "app.workers.tasks.workflow_enrollment_sync",
        "schedule": crontab(hour=1, minute=0),
    },
    "campaign_evaluator": {
        "task": "app.workers.tasks.campaign_evaluator",
        "schedule": crontab(minute="*/5"),
    },
    "email_inbound_poll": {
        "task": "app.workers.tasks.email_inbound_poll",
        "schedule": crontab(minute="*/2"),
    },
    "voice_retry_sweep": {
        "task": "app.workers.tasks.voice_retry_sweep",
        "schedule": crontab(hour="*/4", minute=0),
    },
    "analytics_rollup": {
        "task": "app.workers.tasks.analytics_rollup",
        "schedule": crontab(hour=1, minute=30),
    },
    "integration_sf_sync": {
        "task": "app.workers.tasks.integration_sf_sync",
        "schedule": crontab(hour=2, minute=0),
    },
    "mongo_ttl_cleanup": {
        "task": "app.workers.tasks.mongo_ttl_cleanup",
        "schedule": crontab(hour=3, minute=0, day_of_week=0),
    },
    "redis_cache_warm": {
        "task": "app.workers.tasks.redis_cache_warm",
        "schedule": crontab(hour=6, minute=0),
    },
}
