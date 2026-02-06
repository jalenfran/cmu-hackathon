"""Central configuration using pydantic-settings"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    nessie_api_key: str = "your_key_here"
    kafka_bootstrap_servers: str = "localhost:19092"
    ollama_base_url: str = "http://localhost:11434"
    mock_mode: bool = True

    # Transaction generator settings
    txn_interval_min: float = 1.0
    txn_interval_max: float = 3.0
    anomaly_probability: float = 0.08  # 8% chance of anomaly per transaction

    # Anomaly detection
    anomaly_threshold: float = -0.3  # IsolationForest decision function threshold

    # Agent settings
    ollama_model: str = "llama3:8b"
    max_concurrent_investigations: int = 1

    # Demo mode
    demo_mode: bool = False
    demo_txn_interval: float = 2.0
    demo_anomaly_interval: float = 30.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
