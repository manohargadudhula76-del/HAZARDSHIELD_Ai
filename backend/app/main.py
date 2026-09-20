from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base, get_db
from app.models import habitation, hazard, red_zone, capacity, safe_haven  # noqa: F401 (register models)

from app.routes import (
    habitations,
    hazards,
    red_zones,
    capacity as capacity_router,
    safe_havens,
    relocation,
    map as map_router,
    dashboard,
    gis,
    risk,
    scenarios,
    evacuation,
    cascade,
    analytics,
    alerts,
    ml,
    reports,
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Auto-populate demo dataset if database is empty/new
try:
    from app.seed import seed_db
    seed_db(force=False)
except Exception as _seed_err:
    print(f"Auto-seed notice: {_seed_err}")


app = FastAPI(
    title="HazardShield AI Backend",
    description="Smart India Hackathon 2026 - Disaster Risk Intelligence & Decision Support API (Phase 3)",
    version="3.0.0-production",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - allow Vite dev server, Render, and Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://hazardsheildai.netlify.app",
        "https://hazardshieldai.netlify.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register all routers (Phase 1, Phase 2, & Phase 3)
app.include_router(habitations.router)
app.include_router(hazards.router)
app.include_router(red_zones.router)
app.include_router(capacity_router.router)
app.include_router(safe_havens.router)
app.include_router(relocation.router)
app.include_router(map_router.router)
app.include_router(dashboard.router)
app.include_router(gis.router)
app.include_router(risk.router)
app.include_router(scenarios.router)
app.include_router(evacuation.router)
app.include_router(cascade.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(ml.router)
app.include_router(reports.router)



@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "ok",
        "service": "HazardShield AI Backend",
        "version": "3.0.0-production",
        "note": "AI/ML Risk Intelligence & Decision Support Platform",
    }


@app.api_route("/api/health/db", methods=["GET", "HEAD"])
def health_db():
    try:
        db_gen = get_db()
        db = next(db_gen)
        db.execute(text("SELECT 1"))
        return {"status": "connected", "message": "Database connection successful"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "message": "HAZARDSHIELD AI API is running",
        "docs": "/docs",
        "health": "/api/health",
    }



if __name__ == "__main__":
    import uvicorn
    import sys
    from pathlib import Path
    
    # Ensure backend directory is in sys.path
    backend_dir = Path(__file__).resolve().parent.parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
        
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

