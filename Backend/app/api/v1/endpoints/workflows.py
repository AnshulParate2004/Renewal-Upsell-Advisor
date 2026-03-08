from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID

# Import schemas (assuming you have them, we'll use generic dicts for now if they don't exactly match)
from app.schemas.workflow import (
    WorkflowTemplateResponse,
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
    WorkflowStepResponse,
    WorkflowStepCreate,
    WorkflowStepUpdate
)
from app.api.deps import get_supabase_client

router = APIRouter()

WORKFLOW_TABLE_MISSING_MSG = (
    "Tables 'workflow_templates' / 'workflow_steps' do not exist in Supabase. "
    "Create them in the SQL Editor if you need the Workflows feature."
)


def _is_table_missing(err: Exception) -> bool:
    if getattr(err, "code", None) == "PGRST205":
        return True
    if hasattr(err, "args") and len(err.args) > 0 and isinstance(err.args[0], dict):
        if err.args[0].get("code") == "PGRST205":
            return True
    err_str = str(err).lower()
    if ("workflow_templates" in err_str or "workflow_steps" in err_str) and (
        "schema cache" in err_str or "pgrst205" in err_str or "could not find the table" in err_str
    ):
        return True
    return False


@router.get("/templates", response_model=List[dict])
async def list_workflow_templates(client=Depends(get_supabase_client)):
    """Get all workflow templates and their nested steps."""
    try:
        result = client.table("workflow_templates").select("*, steps:workflow_steps(*)").execute()
        return result.data if result.data else []
    except Exception as e:
        if _is_table_missing(e):
            return []
        raise


@router.post("/templates", response_model=dict)
async def create_workflow_template(template: WorkflowTemplateCreate, client=Depends(get_supabase_client)):
    """Create a new workflow template manually."""
    try:
        result = client.table("workflow_templates").insert(template.model_dump()).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=WORKFLOW_TABLE_MISSING_MSG)
        raise


@router.put("/templates/{template_id}")
async def update_workflow_template(template_id: str, template: WorkflowTemplateUpdate, client=Depends(get_supabase_client)):
    try:
        result = client.table("workflow_templates").update(template.model_dump(exclude_unset=True)).eq("id", template_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=WORKFLOW_TABLE_MISSING_MSG)
        raise


# Steps endpoints
@router.post("/steps", response_model=dict)
async def create_workflow_step(step: WorkflowStepCreate, client=Depends(get_supabase_client)):
    try:
        result = client.table("workflow_steps").insert(step.model_dump()).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=WORKFLOW_TABLE_MISSING_MSG)
        raise


@router.put("/steps/{step_id}")
async def update_workflow_step(step_id: str, step: WorkflowStepUpdate, client=Depends(get_supabase_client)):
    try:
        result = client.table("workflow_steps").update(step.model_dump(exclude_unset=True)).eq("id", step_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=WORKFLOW_TABLE_MISSING_MSG)
        raise


@router.delete("/steps/{step_id}")
async def delete_workflow_step(step_id: str, client=Depends(get_supabase_client)):
    try:
        client.table("workflow_steps").delete().eq("id", step_id).execute()
        return {"success": True}
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=WORKFLOW_TABLE_MISSING_MSG)
        raise
