# Build Revenue Navigator Technical Plan LaTeX document
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$requiredImages = @(
    "images/rnu-tech-platform-architecture.png",
    "images/rnu-tech-data-flow.png",
    "images/rnu-postgres-erd.png",
    "images/rnu-mongo-collections.png",
    "images/rnu-redis-topology.png",
    "images/rnu-async-runtime.png",
    "images/rnu-cron-scheduler.png",
    "images/rnu-langgraph-scoring.png",
    "images/rnu-langgraph-voice.png",
    "images/rnu-langgraph-email-intent.png",
    "images/rnu-langgraph-nba.png",
    "images/rnu-flow-campaign-tech.png",
    "images/rnu-flow-webhook-ingest.png",
    "images/rnu-deployment-topology.png",
    "images/rnu-lifecycle-bucket-classification.png",
    "images/rnu-lifecycle-bucket-filter-bar.png",
    "images/rnu-quarterly-pipeline-matrix.png",
    "images/rnu-dynamic-workflow-engine.png",
    "images/rnu-workflow-step-timeline.png",
    "images/rnu-langgraph-workflow-executor.png",
    "images/rnu-scoring-formula-pipeline.png"
)

foreach ($img in $requiredImages) {
    if (-not (Test-Path $img)) {
        Write-Host "ERROR: Missing $img - regenerate via diagrams/IMAGE_PROMPTS.md"
        exit 1
    }
}

Write-Host "Compiling LaTeX (pass 1)..."
pdflatex -interaction=nonstopmode tech-plan.tex | Out-Null

Write-Host "Compiling LaTeX (pass 2)..."
pdflatex -interaction=nonstopmode tech-plan.tex | Out-Null

if (Test-Path "tech-plan.pdf") {
    Write-Host "Success: tech-plan.pdf"
} else {
    Write-Host "Build failed. Check tech-plan.log"
    exit 1
}
