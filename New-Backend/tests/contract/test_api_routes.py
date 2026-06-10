"""Contract smoke tests — verify tech plan API routes are registered."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoints():
    assert client.get("/health").status_code == 200
    assert client.get("/api/v1/health").status_code == 200


def test_openapi_includes_core_prefixes():
    schema = app.openapi()
    paths = schema.get("paths", {})
    prefixes = [
        "/api/v1/accounts/",
        "/api/v1/lifecycle/dashboard",
        "/api/v1/pipeline/grid",
        "/api/v1/ml/trigger",
        "/api/v1/predictions/health",
        "/api/v1/settings/config",
        "/api/v1/settings/llm-config",
        "/api/v1/workflows/templates",
    ]
    for p in prefixes:
        assert p in paths, f"Missing route {p}"
