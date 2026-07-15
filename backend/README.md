# CrimeSphere AI — Backend Service Configuration

This is the lightweight FastAPI-based backend engine for the **CrimeSphere AI Command Center Platform**. It serves simulated, live-updating incident streams, patrol movements, and prediction statistics for the Ahmedabad metropolitan area.

## 🚀 How to Run the Backend Local Service

1. **Verify Python 3.11+ is installed.**
2. **Install FastAPI and Uvicorn dependencies:**
   ```bash
   pip install fastapi uvicorn pydantic
   ```
3. **Start the API Server:**
   Run the following command from the project root directory (containing the `backend` folder):
   ```bash
   python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```
4. **Access the Documentation:**
   Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser to inspect and interact with the Swagger API endpoints.

---

## 🛠️ API Endpoint Specifications

| Endpoint | Method | Response Description |
|----------|--------|----------------------|
| `/api/dashboard` | `GET` | Aggregated dashboard state including KPIs, active alerts feed, current active zones, and patrol unit coordinates. |
| `/api/system` | `GET` | Live system latency metrics, online status, and service uptime. |
| `/api/statistics` | `GET` | Key performance indicators (alerts, active zones, patrols, and prevented counts). |
| `/api/alerts` | `GET` | Active history log and templates of simulated physical & cyber crimes. |
| `/api/predictions` | `GET` | Zone risk scores, model accuracy parameters, and SHAP XAI explanation factors. |
| `/api/heatmap` | `GET` | Scaled coordinate points filtered dynamically by crime type and time range (24h/7d/30d). |
| `/api/patrols` | `GET` | Current patrol unit statuses, coordinates, and remaining fuel. |
| `/api/officer` | `GET` | Profile credentials and alerts assigned to SI Ravi Sharma (Officer Mobile App screen). |
| `/` | `GET` | Root ping checking overall API service availability. |

---

## ⚙️ Background Simulation Details

The backend starts an asynchronous loop (`run_simulation_loop`) that updates the platform state in-memory every **4 seconds**:
* **Patrol Vehicles:** Move along their predefined routing segments, consuming fuel.
* **Incident Feed:** Appends new critical, high, or medium alerts periodically.
* **Risk Scores:** Fluctuate slightly to reflect active GIS changes.
* **KPIs:** Auto-calculate and increment the "crimes prevented" metrics.
