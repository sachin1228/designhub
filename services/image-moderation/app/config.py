from functools import lru_cache
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="IMAGE_MODERATION_")

    max_upload_bytes: int = 20 * 1024 * 1024
    borderline_min_confidence: float = 0.45
    reject_min_confidence: float = 0.68
    allowed_mime_types: tuple[str, ...] = ("image/jpeg", "image/png", "image/webp")


class ModerationRule(BaseModel):
    class_name: str
    action: str
    confidence: float


@lru_cache
def get_settings() -> Settings:
    return Settings()
