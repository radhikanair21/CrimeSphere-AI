from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

OFFICER_PROFILE = {
    "name": "SI Ravi Sharma",
    "rank": "Sub-Inspector",
    "badge": "SI-8902",
    "unit": "P-03",
    "avatar": "R"
}

@router.get("/officer")
async def get_officer():
    # Return details for the officer app screen, synchronizing with global active alert feed
    current_alert = None
    if sim_engine.alert_history:
        current_alert = sim_engine.alert_history[0]
        
    return {
        "profile": OFFICER_PROFILE,
        "current_alert": current_alert,
        "risk_score": 78,
        "assigned_zone": "Navrangpura",
        "route_waypoints": sim_engine.patrol_routes["P-03"]
    }
