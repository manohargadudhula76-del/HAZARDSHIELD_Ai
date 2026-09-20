# HAZARDSHIELD AI - FastAPI Backend

FastAPI & MySQL Backend for Smart India Hackathon (SIH 2026).

## Directory Structure
```
backend/
│
├── app/
│   ├── main.py                    # FastAPI entrypoint, middleware, router registration
│   ├── database.py                # Database connection, SessionLocal, Base, engine
│   │
│   ├── models/                    # SQLAlchemy ORM database models
│   │   ├── habitation.py
│   │   ├── hazard.py
│   │   ├── red_zone.py
│   │   ├── capacity.py
│   │   └── safe_haven.py
│   │
│   ├── schemas/                   # Pydantic validation schemas
│   │   ├── habitation.py
│   │   ├── hazard.py
│   │   ├── red_zone.py
│   │   ├── capacity.py
│   │   ├── safe_haven.py
│   │   ├── map.py
│   │   ├── relocation.py
│   │   └── dashboard.py
│   │
│   ├── routes/                    # API Route controllers
│   │   ├── habitations.py
│   │   ├── hazards.py
│   │   ├── red_zones.py
│   │   ├── capacity.py
│   │   ├── safe_havens.py
│   │   ├── relocation.py
│   │   ├── map.py
│   │   └── dashboard.py
│   │
│   └── services/                  # Business & recommendation logic
│       ├── risk_service.py
│       ├── capacity_service.py
│       └── relocation_service.py
│
├── requirements.txt               # Dependencies
├── .env.example                   # Environment configuration template
├── seed.py                        # Realistic demo database seeding script
└── README.md
```

## Running the Backend

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Seed demo dataset (32 habitations, 24 hazards, 22 red zones, 16 capacity records, 12 safe havens):
   ```bash
   python seed.py
   ```

4. Start FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Access Swagger Docs:
   `http://localhost:8000/docs`
