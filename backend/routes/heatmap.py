from fastapi import APIRouter
from backend.utils.simulation import sim_engine

router = APIRouter()

# Heatmap raw coordinates matching our frontend requirements
RAW_HEAT_DATA = {
    "theft": [
        [23.0225, 72.5714, 0.9], [23.0240, 72.5730, 0.7], [23.0210, 72.5700, 0.8],
        [23.0835, 72.6472, 0.85],[23.0850, 72.6480, 0.6], [23.0820, 72.6460, 0.7],
        [22.9862, 72.5949, 0.7], [22.9850, 72.5960, 0.6], [22.9870, 72.5940, 0.65],
        [23.0280, 72.5260, 0.5], [23.0295, 72.5275, 0.45],[23.0270, 72.5250, 0.5],
        [23.0180, 72.5800, 0.6], [23.0350, 72.5900, 0.55],[23.0100, 72.5650, 0.5],
        [23.0450, 72.5600, 0.4], [23.0300, 72.5400, 0.45],[23.0150, 72.5500, 0.4],
    ],
    "cyber": [
        [23.0225, 72.5714, 0.8], [23.0274, 72.5097, 0.75],[23.0395, 72.5100, 0.6],
        [23.0225, 72.5936, 0.7], [23.0210, 72.5920, 0.65],[23.0240, 72.5950, 0.6],
        [23.0500, 72.5800, 0.55],[23.0600, 72.5200, 0.5], [22.9900, 72.5800, 0.5],
        [23.0700, 72.6000, 0.45],[23.0400, 72.5700, 0.5], [23.0300, 72.5600, 0.45],
    ],
    "vehicle": [
        [23.0395, 72.5100, 0.9], [23.0410, 72.5115, 0.75],[23.0380, 72.5090, 0.8],
        [23.0350, 72.4700, 0.4], [23.0450, 72.5300, 0.55],[23.0520, 72.5400, 0.5],
        [22.9800, 72.5600, 0.45],[23.0600, 72.5800, 0.4], [23.0200, 72.4900, 0.45],
    ],
    "assault": [
        [23.0835, 72.6472, 0.95],[23.0820, 72.6460, 0.8], [23.0850, 72.6490, 0.75],
        [22.9862, 72.5949, 0.6], [23.0100, 72.6000, 0.55],[23.0700, 72.6200, 0.5],
        [23.0500, 72.6000, 0.45],[22.9900, 72.5500, 0.4], [23.0050, 72.5800, 0.45],
    ],
    "fraud": [
        [23.0225, 72.5936, 0.85],[23.0240, 72.5945, 0.7], [23.0215, 72.5920, 0.75],
        [23.0225, 72.5714, 0.7], [23.0274, 72.5097, 0.65],[23.0395, 72.5100, 0.55],
        [23.0280, 72.5260, 0.5], [23.0500, 72.5500, 0.45],[23.0150, 72.5700, 0.5],
        [23.0600, 72.5900, 0.4], [22.9950, 72.6000, 0.45],[23.0400, 72.6100, 0.4],
    ],
}
RAW_HEAT_DATA["all"] = [pt for sublist in RAW_HEAT_DATA.values() for pt in sublist]

HEAT_STATS = {
    "all":     { "events": 1247, "predictions": 89, "coverage": "94%", "danger": "Naroda" },
    "theft":   { "events": 482,  "predictions": 34, "coverage": "91%", "danger": "Navrangpura" },
    "cyber":   { "events": 318,  "predictions": 22, "coverage": "88%", "danger": "Kalupur" },
    "vehicle": { "events": 214,  "predictions": 15, "coverage": "87%", "danger": "SG Highway" },
    "assault": { "events": 143,  "predictions": 11, "coverage": "89%", "danger": "Naroda" },
    "fraud":   { "events": 290,  "predictions": 18, "coverage": "85%", "danger": "Kalupur" },
}

@router.get("/heatmap")
async def get_heatmap(crime_type: str = "all", time_range: str = "24h"):
    # Return scaled data based on range
    multiplier = { "24h": 1.0, "7d": 1.4, "30d": 1.8 }.get(time_range, 1.0)
    data = RAW_HEAT_DATA.get(crime_type, RAW_HEAT_DATA["all"])
    
    scaled_data = [
        [pt[0], pt[1], min(pt[2] * multiplier, 1.0)] 
        for pt in data
    ]
    
    stats = HEAT_STATS.get(crime_type, HEAT_STATS["all"]).copy()
    rm = { "24h": 1, "7d": 7, "30d": 30 }.get(time_range, 1)
    stats["events"] = int(stats["events"] * rm * 0.85)
    
    return {
        "data": scaled_data,
        "stats": stats
    }
