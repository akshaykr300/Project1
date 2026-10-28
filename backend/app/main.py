"""
Fake UPI Shield - FastAPI Backend Entrypoint
Mounts modular routers, sets up CORS middleware, and configures lifecycle events.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.api.routes import health, analyze, history, stats, model, training

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("fake_upi_shield")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode...")
    logger.info(f"CORS origins configured: {settings.cors_origin_list}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-Based Fake UPI Payment Screenshot Detector Backend. "
        "Provides OpenCV image preprocessing, Tesseract OCR text extraction, "
        "CNN model inference, transparent heuristic rule verification, and MySQL audit history."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(model.router)
app.include_router(training.router)


@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_check": "/health",
        "notice": "Screenshots alone cannot prove that a genuine bank transfer occurred."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
