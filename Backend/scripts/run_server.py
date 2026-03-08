"""
Start the FastAPI dev server with reload.
Use this if `uvicorn` from the CLI fails with "Failed to canonicalize script path"
(e.g. on some Windows/uv-managed venv setups). Run from Backend: uv run scripts/run_server.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
