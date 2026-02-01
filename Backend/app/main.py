from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import dashboard, advisor

app = FastAPI(title="S-007 Renewal & Upsell Advisor")

# CORS Configuration
origins = [
    "http://localhost:3000",
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

@app.get("/")
def read_root():
    return {"message": "S-007 Advisor Backend is Running"}
