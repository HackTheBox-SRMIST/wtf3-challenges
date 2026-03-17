from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    sqlite_path: str = "notes.db"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
