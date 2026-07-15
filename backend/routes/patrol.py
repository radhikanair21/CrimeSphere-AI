from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

@router.get("/patrols")
async def get_patrols():
    return {
        "patrols": sim_engine.patrols,
        "routes": sim_engine.patrol_routes
    }
