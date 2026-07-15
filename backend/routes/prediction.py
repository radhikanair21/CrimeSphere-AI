from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

@router.get("/predictions")
async def get_predictions():
    return {
        "shap_factors": sim_engine.shap_factors,
        "risk_table_data": sim_engine.risk_table_data,
        "model_accuracy": sim_engine.model_accuracy
    }
