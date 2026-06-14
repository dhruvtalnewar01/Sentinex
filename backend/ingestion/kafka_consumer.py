"""
SENTINEX v2.0 — Kafka Consumer
Async Kafka consumer that ingests raw events and feeds them to the agent pipeline
"""
import asyncio
import json
from typing import Callable, Optional
from backend.core.config import get_settings
from backend.core.logging import get_logger

logger = get_logger("kafka.consumer")
settings = get_settings()


class SentinexKafkaConsumer:
    """Async Kafka consumer for ingesting security events."""

    def __init__(self, topics: Optional[list] = None, on_event: Optional[Callable] = None):
        self.topics = topics or [
            "sentinex.raw.netflow",
            "sentinex.raw.syslog",
            "sentinex.raw.endpoint",
            "sentinex.raw.cve",
            "sentinex.raw.osint",
            "sentinex.normalized",
        ]
        self.on_event = on_event
        self.consumer = None
        self.running = False

    async def start(self):
        """Start consuming events from Kafka."""
        try:
            from aiokafka import AIOKafkaConsumer

            self.consumer = AIOKafkaConsumer(
                *self.topics,
                bootstrap_servers=settings.kafka_bootstrap_servers,
                group_id=settings.kafka_consumer_group,
                auto_offset_reset="latest",
                enable_auto_commit=True,
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            )
            await self.consumer.start()
            self.running = True
            logger.info("kafka_consumer_started", topics=self.topics)

            async for msg in self.consumer:
                if not self.running:
                    break
                try:
                    if self.on_event:
                        await self.on_event(msg.value, msg.topic)
                except Exception as e:
                    logger.error("event_processing_error", error=str(e), topic=msg.topic)

        except ImportError:
            logger.warning("aiokafka_not_installed", msg="Running in demo mode without Kafka")
        except Exception as e:
            logger.error("kafka_consumer_error", error=str(e))
        finally:
            if self.consumer:
                await self.consumer.stop()

    async def stop(self):
        """Stop the consumer."""
        self.running = False
        if self.consumer:
            await self.consumer.stop()
        logger.info("kafka_consumer_stopped")
