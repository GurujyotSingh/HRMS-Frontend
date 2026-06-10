from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
	model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")
	
	DATABASE_URL : str
	SECRET_KEY : str
	ALGORITHM: str = "HS256"
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
	ANTHROPIC_API_KEY: str = ""   
	OPENAI_API_KEY: str = ""       # optional, used as fallback only
	GROQ_API_KEY: str = ""
	PAYROLL_AES_KEY: str = ""
	
	SMTP_SERVER: str = "smtp.gmail.com"
	SMTP_PORT: int = 587
	SMTP_USER: str = ""
	SMTP_PASSWORD: str = ""

settings = Settings()