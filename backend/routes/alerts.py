from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

@router.get("/alerts")
async def get_alerts():
    return {
        "templates": sim_engine.alert_templates,
        "history": sim_engine.alert_history
    }
