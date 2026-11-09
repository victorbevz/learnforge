from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr

ENV_FILE = Path(__file__).resolve().parents[2]/".env"

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = Field(min_length=32, repr=False)
    access_token_expire_minutes: int = Field(default=30, gt=0)
    groq_api_key: SecretStr | None = None
    model_config = SettingsConfigDict(env_file=ENV_FILE)

settings = Settings()