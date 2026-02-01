from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import dashboard, advisor, websocket

app = FastAPI(title="RevIQ Renewal & Upsell Advisor")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Add Vite default port
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(advisor.router, prefix="/api/advisor", tags=["Advisor"])
app.include_router(websocket.router, tags=["Websocket"])

@app.get("/")
def read_root():
    return {"message": "RevIQ Advisor Backend is Running"}
