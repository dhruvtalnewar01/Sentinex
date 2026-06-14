"""
SENTINEX v2.0 — Configuration
Environment-based settings via pydantic-settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Anthropic API ──
    anthropic_api_key: str = "sk-placeholder"
    anthropic_model: str = "claude-sonnet-4-5"

    # ── Kafka ──
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group: str = "sentinex-agent-cluster"

    # ── Neo4j ──
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "sentinex123"

    # ── ChromaDB ──
    chromadb_host: str = "localhost"
    chromadb_port: int = 8001

    # ── Redis ──
    redis_url: str = "redis://localhost:6379/0"

    # ── Firewall Stubs ──
    pfsense_api_url: str = "http://localhost:9999/api/pfsense"
    cloudflare_api_token: str = "stub_token"

    # ── Application ──
    log_level: str = "INFO"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    demo_mode: bool = True

    # ── Agent Configuration ──
    threat_score_threshold: float = 0.55
    soc_analyst_max_rounds: int = 3
    soc_analyst_confidence_threshold: int = 85
    autonomous_response_enabled: bool = True
    hitl_irreversibility_threshold: float = 0.8

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
