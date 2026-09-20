import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("hazardshield.database")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/hazardshield_db")
FALLBACK_SQLITE_URL = "sqlite:///./hazardshield.db"

active_db_type = "mysql"
engine = None
SessionLocal = None


def init_engine():
    global engine, SessionLocal, active_db_type
    try:
        masked_url = DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL
        logger.info(f"Attempting to connect to database using: {masked_url}")

        if "mysql" in DATABASE_URL:
            temp_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            with temp_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            engine = temp_engine
            active_db_type = "mysql"
            logger.info("Successfully connected to MySQL database.")
        else:
            engine = create_engine(DATABASE_URL)
            active_db_type = "other"

    except Exception as e:
        logger.warning(f"Could not connect to primary database ({e}).")
        logger.info(f"Falling back to local SQLite database ({FALLBACK_SQLITE_URL}) to ensure uninterrupted prototype operation.")
        engine = create_engine(
            FALLBACK_SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        active_db_type = "sqlite"

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


init_engine()

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            return {
                "status": "connected",
                "database_type": active_db_type,
                "detail": f"Database responds successfully (SELECT 1 -> {result})"
            }
    except Exception as e:
        return {
            "status": "error",
            "database_type": active_db_type,
            "detail": str(e)
        }
