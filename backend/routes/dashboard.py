from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard():
    # Force a simulation step on call so local reload displays immediate changes
    sim_engine.step()
    return sim_engine.get_dashboard_data()

@router.get("/system")
async def get_system_status():
    return sim_engine.get_system_status()

@router.get("/statistics")
async def get_statistics():
    return sim_engine.get_kpis()

@router.post("/simulate")
async def trigger_simulation_scenario(event: str):
    sim_engine.trigger_scenario(event)
    return {"status": "success", "event_triggered": event}

@router.get("/audit")
async def get_audit_logs():
    return [
        {"timestamp": "11:42:01", "actor_id": "SI-8902", "role": "Officer", "action": "Patrol route check-in", "scope": "Navrangpura Sector", "ip": "10.42.12.80", "status": "SUCCESS"},
        {"timestamp": "11:38:15", "actor_id": "DCP-1102", "role": "DCP", "action": "GNN risk score forecast run", "scope": "Ahmedabad District", "ip": "10.42.1.15", "status": "SUCCESS"},
        {"timestamp": "11:29:40", "actor_id": "COM-0001", "role": "Commissioner", "action": "Emergency dispatch bypass", "scope": "Kalupur Station Area", "ip": "10.42.0.1", "status": "SUCCESS"},
        {"timestamp": "11:15:22", "actor_id": "INS-4402", "role": "Inspector", "action": "CCTV CV overlay access", "scope": "Maninagar CCTV-204", "ip": "10.42.8.22", "status": "SUCCESS"},
    ]
