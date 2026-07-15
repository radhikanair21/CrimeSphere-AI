import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.dashboard import router as dashboard_router
from backend.routes.alerts import router as alerts_router
from backend.routes.prediction import router as prediction_router
from backend.routes.heatmap import router as heatmap_router
from backend.routes.patrol import router as patrol_router
from backend.routes.officer import router as officer_router
from backend.utils.simulation import run_simulation_loop

app = FastAPI(
    title="CrimeSphere AI Backend",
    description="Simulated backend for Ahmedabad Predictive Policing Command Center",
    version="1.0.0"
)

# Enable CORS for local file:// access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(heatmap_router, prefix="/api")
app.include_router(patrol_router, prefix="/api")
app.include_router(officer_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Start the simulation loop in the background
    asyncio.create_task(run_simulation_loop())

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "CrimeSphere AI Core API Engine",
        "version": "1.0.0"
    }
