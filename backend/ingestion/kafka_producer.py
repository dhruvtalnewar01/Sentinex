"""
SENTINEX v2.0 — Kafka Producer
Event publisher for simulators and tests
"""
import json
from typing import Dict, Any, Optional
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("kafka.producer")
settings = get_settings()


class SentinexKafkaProducer:
    """Async Kafka producer for publishing security events."""

    def __init__(self):
        self.producer = None

    async def start(self):
        """Initialize the Kafka producer."""
        try:
            from aiokafka import AIOKafkaProducer

            self.producer = AIOKafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
            )
            await self.producer.start()
            logger.info("kafka_producer_started")
        except ImportError:
            logger.warning("aiokafka_not_installed", msg="Running in demo mode")
        except Exception as e:
            logger.error("kafka_producer_start_error", error=str(e))

    async def publish(self, topic: str, event: Dict[str, Any], key: Optional[str] = None):
        """Publish an event to a Kafka topic."""
        if not self.producer:
            logger.debug("kafka_producer_not_available", topic=topic)
            return

        try:
            partition_key = key or event.get("source_ip", "default")
            await self.producer.send_and_wait(topic, value=event, key=partition_key)
            logger.debug("event_published", topic=topic, event_type=event.get("event_type"))
        except Exception as e:
            logger.error("event_publish_error", error=str(e), topic=topic)

    async def stop(self):
        """Stop the producer."""
        if self.producer:
            await self.producer.stop()
        logger.info("kafka_producer_stopped")
