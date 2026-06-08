# Build Revenue Navigator Framework LaTeX document
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "images/rnu-architecture-flow.png")) {
    Write-Host "ERROR: Missing images/rnu-architecture-flow.png - regenerate via AI image prompts."
    exit 1
}

Write-Host "Compiling LaTeX (pass 1)..."
pdflatex -interaction=nonstopmode revenue-navigator-framework.tex | Out-Null

Write-Host "Compiling LaTeX (pass 2)..."
pdflatex -interaction=nonstopmode revenue-navigator-framework.tex | Out-Null

if (Test-Path "revenue-navigator-framework.pdf") {
    Write-Host "Success: revenue-navigator-framework.pdf"
} else {
    Write-Host "Build failed. Check revenue-navigator-framework.log"
    exit 1
}
