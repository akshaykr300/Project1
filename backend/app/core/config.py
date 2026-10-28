"""
Application Configuration Module
Reads from environment variables and provides typed settings with safe defaults.
"""
from functools import lru_cache
from typing import List
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "Fake UPI Shield Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # MySQL Database Connection
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_NAME: str = "fake_upi_detector"
    DB_USER: str = "root"
    DB_PASSWORD: str = "change_me"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # Tesseract OCR Executable Path
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "C:\\Program Files\\Tesseract-OCR\\tesseract.exe")

    # Machine Learning Settings
    MODEL_WEIGHTS_PATH: str = "backend/app/ml/weights/fake_upi_cnn_active.keras"
    CLASS_MAPPING_PATH: str = "backend/app/ml/weights/class_mapping.json"
    DATASET_ROOT: str = "data/dataset"

    # Upload Constraints
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,webp"
    KEEP_ORIGINAL_SCREENSHOTS: bool = False

    model_config = SettingsConfigDict(
        env_file="backend/.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",") if ext.strip()]

    @property
    def database_url(self) -> str:
        # Standard PyMySQL connection string
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
