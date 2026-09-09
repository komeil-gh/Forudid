from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: SecretStr
    s3_endpoint: str
    s3_region: str = "us-east-1"
    s3_access_key: SecretStr
    s3_secret_key: SecretStr
    s3_bucket: str = "forudid"
    s3_path_style: bool = True
    s3_prefix: str = "aoi"
    cors_origins: list[str] = []
    application_version: str = "0.3.0-alpha.6"
    tile_cache_seconds: int = Field(default=3600, ge=0)
    allow_fixture_products: bool = False
    report_chrome_binary: str | None = None


@lru_cache
def settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
