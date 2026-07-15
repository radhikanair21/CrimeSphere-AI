from pydantic import BaseModel
from typing import List, Optional

class ZoneSchema(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    risk: int
    level: str
    crime: str
    conf: int
    patrol: str

class PatrolUnitSchema(BaseModel):
    id: str
    officer: str
    zone: str
    lat: float
    lng: float
    status: str
    fuel: int
    color: str

class AlertSchema(BaseModel):
    level: str
    icon: str
    title: str
    detail: str
    zone: str
    timestamp: Optional[float] = None

class KPIStats(BaseModel):
    alerts: int
    zones: int
    patrols: int
    prevented: int

class SystemStatus(BaseModel):
    online: bool
    db_status: str
    pipeline_latency: str
    uptime: float

class DashboardState(BaseModel):
    kpis: KPIStats
    active_alerts: List[AlertSchema]
    zones: List[ZoneSchema]
    patrols: List[PatrolUnitSchema]
    system: SystemStatus
