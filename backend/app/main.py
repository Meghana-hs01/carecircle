import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.seed import seed_demo_data

# Import routers
from app.routers import (
    health, auth, profiles, care_circle, medications,
    appointments, care_activities, timeline, notifications,
    analytics, jobs, ai_assistant
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed demo data
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo dataset
    db = SessionLocal()
    try:
        seed_demo_data(db)
    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
    finally:
        db.close()
    
    logger.info(f"{settings.PROJECT_NAME} v{settings.VERSION} ready.")
    yield
    logger.info("Shutting down CareCircle backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CareCircle — Shared Healthcare Management Ecosystem for Elderly, Family & Caretakers",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Include Routers
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(profiles.router, prefix=settings.API_V1_STR)
app.include_router(care_circle.router, prefix=settings.API_V1_STR)
app.include_router(medications.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(care_activities.router, prefix=settings.API_V1_STR)
app.include_router(timeline.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(ai_assistant.router, prefix=settings.API_V1_STR)

# Integrated Frontend SPA Serving
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist_candidates = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    "/frontend/dist",
    "/app/frontend/dist",
]
frontend_dist = None
for candidate in frontend_dist_candidates:
    if os.path.exists(candidate) and os.path.isdir(candidate):
        frontend_dist = candidate
        break

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Allow API, docs, openapi, health, and ready to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("health") or full_path.startswith("ready"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        candidate_file = os.path.join(frontend_dist, full_path)
        if os.path.isfile(candidate_file):
            return FileResponse(candidate_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
