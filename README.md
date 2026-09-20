# HAZARDSHIELD AI

> **Smart India Hackathon (SIH 2026)**
> **Problem Statement**: *Intelligent Identification of Hazard-Based Red Zones, Carrying Capacity Assessment, and Immediate Relocation Needs for Vulnerable Habitations*

---

## 🏛️ System Architecture

```
                 REACT FRONTEND (Vite + TypeScript + Leaflet)
                                       ↓
                           CENTRAL API SERVICE (api.ts)
                                       ↓
                           FASTAPI REST BACKEND (Python)
                                       ↓
                              SQLALCHEMY ORM
                                       ↓
                           MYSQL DATABASE (PyMySQL)
                                       ↓
        ┌──────────────┼───────────────────────────────┐
        ↓              ↓                               ↓
   HABITATIONS      HAZARDS                        RED ZONES
  (32 records)    (24 records)                    (22 records)
        ↓              ↓                               ↓
        └──────────────┼───────────────────────────────┘
                       ↓
               CARRYING CAPACITY (16 records)
                       ↓
                  SAFE HAVENS (12 destinations)
                       ↓
             RULE-BASED RELOCATION ENGINE (Haversine Distance)
                       ↓
             REACT LEAFLET MAP & DASHBOARD KPIS
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+
- **MySQL Server** (Optional for local development; SQLite fallback enabled automatically)

---

### 2. Backend Setup (FastAPI & MySQL)

#### A. Navigate to backend directory:
```bash
cd backend
```

#### B. Create & configure `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your MySQL connection:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/hazardshield_db
APP_ENV=development
API_PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

#### C. Create MySQL Database:
In MySQL shell / Workbench:
```sql
CREATE DATABASE IF NOT EXISTS hazardshield_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### D. Install Dependencies:
```bash
pip install -r requirements.txt
```

#### E. Seed Realistic Demo Dataset:
Populates 32 habitations, 24 hazards, 22 red zones, 16 capacity records, and 12 safe havens across disaster-prone Indian states (Assam, Uttarakhand, Himachal Pradesh, Odisha, West Bengal, Bihar, Kerala, Andhra Pradesh, Maharashtra):
```bash
python seed.py
```

#### F. Start FastAPI Server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

### 3. Frontend Setup (React + TypeScript)

#### A. Install Node dependencies:
```bash
npm install
```

#### B. Start Vite Development Server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 Core API Endpoints (40% Backend Phase)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health status |
| `GET` | `/api/health/db` | MySQL connection verification |
| `GET` | `/api/map/locations` | All GIS locations (Habitations, Red Zones with radius, Safe Havens) |
| `GET` | `/api/dashboard/summary` | Real-time KPI aggregation from database |
| `GET` | `/api/habitations` | Query habitations with filters (`state`, `district`, `risk_level`, `relocation_priority`) |
| `GET` | `/api/habitations/{id}` | Detailed habitation data with linked hazards |
| `GET` | `/api/hazards` | Query hazards with filters (`hazard_type`, `severity`, `state`) |
| `GET` | `/api/hazards/{habitation_id}` | Hazards affecting a specific habitation |
| `GET` | `/api/red-zones` | Red zones with filters (`state`, `district`, `risk_level`, `hazard_type`) |
| `GET` | `/api/red-zones/{id}` | Detailed red zone perimeter & population telemetry |
| `GET` | `/api/capacity` | Carrying capacity records (`state`, `status`) |
| `GET` | `/api/capacity/{id}` | Detailed capacity status with safe resource calculation |
| `GET` | `/api/safe-havens` | Safe haven destinations (`state`, `status`) |
| `GET` | `/api/safe-havens/{id}` | Detailed safe haven telemetry |
| `GET` | `/api/relocation/{habitation_id}` | Rule-based relocation recommendation using Haversine formula & suitability scoring |

---

## 🗺️ React Leaflet Map Features
- **Habitation Markers**: Risk-level colored pins with popups showing Name, District, State, Population, Risk Score, Relocation Priority, and "View Details" link.
- **Red Zone Buffers**: Distinct warning marker with spatial circle buffer (`radius * 1000m`) showing danger level and exposed population.
- **Safe Havens**: Emerald shield markers with available capacity, safety score, healthcare rating, and direct relocation action.
- **Permanent Light Map**: Uses OpenStreetMap tiles in both Light and Dark application themes.
- **Graceful Fallback**: If the backend is temporarily offline, the frontend safely displays prototype data with a clear status indicator without crashing.

---

## 📋 Phase 2 Roadmap (Upcoming)
- Advanced AI/ML hazard forecasting models
- Satellite imagery overlay & multi-spectral risk analysis
- Real-time weather alerts & telemetry ingestion
- User authentication & role-based SDMA authority controls
- Evacuation route network optimization
