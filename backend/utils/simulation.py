import os
import json
import random
import time
import asyncio
from typing import List, Dict, Any

class SimulationEngine:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self.zones = self._load_json("hotspots.json")
        self.patrols = self._load_json("patrols.json")
        
        alerts_data = self._load_json("alerts.json")
        self.alert_templates = alerts_data.get("templates", [])
        self.alert_history = alerts_data.get("history", [])
        
        predictions_data = self._load_json("predictions.json")
        self.shap_factors = predictions_data.get("shap_factors", [])
        self.risk_table_data = predictions_data.get("risk_table_data", [])
        self.model_accuracy = predictions_data.get("model_accuracy", {})
        
        self.start_time = time.time()
        self.tick_count = 0
        self.prevented_count = 147
        
        # Route waypoints for patrol units to cycle through
        self.patrol_routes = {
            "P-01": [
                [23.0835, 72.6472], [23.0820, 72.6400], [23.0780, 72.6350],
                [23.0820, 72.6300], [23.0860, 72.6380], [23.0835, 72.6472],
            ],
            "P-02": [
                [23.0395, 72.5100], [23.0420, 72.5050], [23.0450, 72.5000],
                [23.0480, 72.5080], [23.0430, 72.5150], [23.0395, 72.5100],
            ],
            "P-03": [
                [23.0225, 72.5714], [23.0250, 72.5750], [23.0270, 72.5700],
                [23.0240, 72.5660], [23.0210, 72.5690], [23.0225, 72.5714],
            ],
            "P-04": [
                [22.9862, 72.5949], [22.9840, 72.5920], [22.9810, 72.5960],
                [22.9830, 72.6000], [22.9870, 72.5990], [22.9862, 72.5949],
            ],
            "P-05": [
                [23.0225, 72.5936], [23.0210, 72.5900], [23.0190, 72.5940],
                [23.020, 72.5970], [23.0225, 72.5980], [23.0225, 72.5936],
            ],
            "P-06": [
                [23.0280, 72.5260], [23.0300, 72.5220], [23.0320, 72.5260],
                [23.0310, 72.5300], [23.0285, 72.5295], [23.0280, 72.5260],
            ]
        }
        
        # Keep track of current waypoint indices
        self.route_indices = {pid: 0 for pid in self.patrol_routes.keys()}

    def _load_json(self, filename: str) -> Any:
        path = os.path.join(self.data_dir, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def get_kpis(self) -> Dict[str, int]:
        critical_and_high_alerts = sum(1 for a in self.alert_history if a.get("level") in ["critical", "high"])
        return {
            "alerts": len(self.alert_history),
            "zones": len([z for z in self.zones if z.get("level") in ["critical", "high"]]),
            "patrols": len(self.patrols),
            "prevented": self.prevented_count
        }

    def get_system_status(self) -> Dict[str, Any]:
        return {
            "online": True,
            "db_status": "CONNECTED",
            "pipeline_latency": "14ms",
            "uptime": round(time.time() - self.start_time, 1)
        }

    def get_dashboard_data(self) -> Dict[str, Any]:
        return {
            "kpis": self.get_kpis(),
            "active_alerts": self.alert_history[:12],
            "zones": self.zones,
            "patrols": self.patrols,
            "system": self.get_system_status()
        }

    def step(self):
        """Simulate one state transition (called periodically or on get requests to simulate time flow)"""
        self.tick_count += 1
        
        # 1. Update patrol unit positions (move along their waypoints)
        for unit in self.patrols:
            pid = unit["id"]
            if pid in self.patrol_routes:
                waypoints = self.patrol_routes[pid]
                idx = self.route_indices[pid]
                
                # Move slightly towards next waypoint or snap to next waypoint
                current_wp = waypoints[idx]
                next_idx = (idx + 1) % len(waypoints)
                next_wp = waypoints[next_idx]
                
                # Simple interpolation / step movement (simulate real patrol pathing)
                lat_step = (next_wp[0] - current_wp[0]) * 0.15
                lng_step = (next_wp[1] - current_wp[1]) * 0.15
                
                unit["lat"] += lat_step + (random.random() - 0.5) * 0.0005
                unit["lng"] += lng_step + (random.random() - 0.5) * 0.0005
                
                # Fuel drop
                unit["fuel"] = max(10, unit["fuel"] - random.choice([0, 1]))
                if unit["fuel"] <= 15:
                    unit["fuel"] = 98 # refueled!
                
                # Check if close to next waypoint and increment index
                dist = abs(unit["lat"] - next_wp[0]) + abs(unit["lng"] - next_wp[1])
                if dist < 0.003:
                    self.route_indices[pid] = next_idx
                    
        # 2. Risk scores fluctuate slightly
        for zone in self.zones:
            change = random.choice([-2, -1, 0, 1, 2])
            zone["risk"] = max(10, min(99, zone["risk"] + change))
            if zone["risk"] >= 70:
                zone["level"] = "critical"
            elif zone["risk"] >= 50:
                zone["level"] = "high"
            elif zone["risk"] >= 30:
                zone["level"] = "medium"
            else:
                zone["level"] = "low"
                
        # Update predictions table data to match the zone risks
        for row in self.risk_table_data:
            zone_obj = next((z for z in self.zones if z["name"].lower() == row["zone"].lower()), None)
            if zone_obj:
                row["risk"] = zone_obj["risk"]
                row["level"] = zone_obj["level"]
                if row["level"] == "critical":
                    row["status"] = "ACTIVE ALERT"
                    row["priority"] = "P1 — Immediate"
                elif row["level"] == "high":
                    row["status"] = "MONITORING"
                    row["priority"] = "P2 — High"
                elif row["level"] == "medium":
                    row["status"] = "WATCH"
                    row["priority"] = "P3 — Medium"
                else:
                    row["status"] = "NORMAL"
                    row["priority"] = "P4 — Low"

        # 3. Prevented crimes counter updates
        if self.tick_count % 3 == 0:
            self.prevented_count += random.choice([0, 1])

        # 4. Generate new alert every few ticks
        if self.tick_count % 4 == 0:
            tpl = random.choice(self.alert_templates)
            # Avoid duplicate titles at the top of history
            if not self.alert_history or self.alert_history[0]["title"] != tpl["title"]:
                new_alert = tpl.copy()
                new_alert["timestamp"] = time.time()
                self.alert_history.insert(0, new_alert)
                # Cap alert history
                if len(self.alert_history) > 50:
                    self.alert_history.pop()

    def trigger_scenario(self, scenario: str):
        if scenario == "navratri":
            for zone in self.zones:
                if zone["id"] in ["navrangpura", "naroda", "maninagar"]:
                    zone["risk"] = random.randint(92, 99)
                    zone["level"] = "critical"
                    zone["crime"] = "Festival Crowd Surges & Pickpocketing"
            new_alert = {
                "level": "critical",
                "icon": "fa-people-group",
                "title": "CROWD ANOMALY — Navratri Surges",
                "detail": "Navrangpura GMDC Ground · 10,000+ cluster detected · High risk of stampede",
                "zone": "Navrangpura",
                "timestamp": time.time()
            }
            self.alert_history.insert(0, new_alert)
            self.prevented_count += 5
            
        elif scenario == "phishing":
            for zone in self.zones:
                if zone["id"] in ["satellite", "kalupur"]:
                    zone["risk"] = random.randint(86, 94)
                    zone["level"] = "critical"
                    zone["crime"] = "Cyber Phishing & OTP Fraud"
            new_alert = {
                "level": "critical",
                "icon": "fa-shield-virus",
                "title": "CYBER ATTACK — Phishing Wave",
                "detail": "High-frequency OTP frauds correlated in Satellite and Kalupur ATM sectors",
                "zone": "Satellite",
                "timestamp": time.time()
            }
            self.alert_history.insert(0, new_alert)
            self.prevented_count += 3

        elif scenario == "emergency":
            new_alert = {
                "level": "critical",
                "icon": "fa-phone-volume",
                "title": "EMERGENCY 112 — Multiple Calls",
                "detail": "Naroda GIDC crossroads · Multiple vehicle accident & crowd block",
                "zone": "Naroda",
                "timestamp": time.time()
            }
            self.alert_history.insert(0, new_alert)
            
        elif scenario == "normal":
            self.zones = self._load_json("hotspots.json")
            
        self.step()

# Global singleton simulation state
sim_engine = SimulationEngine()

async def run_simulation_loop():
    """FastAPI lifecycle background task to run step() every 4 seconds"""
    while True:
        sim_engine.step()
        await asyncio.sleep(4.0)
