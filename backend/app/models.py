from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text, Index, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta
from .database import Base

class Merchant(Base):
    __tablename__ = "merchants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    api_key = Column(String(64), unique=True, nullable=False)
    api_secret = Column(String(64), nullable=False)
    webhook_url = Column(String(255), nullable=True)
    webhook_secret = Column(String(64), nullable=True) # Required for signature
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id = Column(String(64), primary_key=True)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String(20), default="open")
    receipt = Column(String(100), nullable=True)
    notes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String(64), primary_key=True)
    order_id = Column(String(64), ForeignKey("orders.id"), nullable=False)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(3), default="INR")
    method = Column(String(20), nullable=False)
    status = Column(String(20), default="pending") # Task 7.1 requires 'pending' start
    captured = Column(Boolean, default=False) # Required for capture endpoint
    error_code = Column(String(50), nullable=True)
    error_description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Refund(Base):
    __tablename__ = "refunds"
    id = Column(String(64), primary_key=True) # Format: rfnd_ + 16 chars
    payment_id = Column(String(64), ForeignKey("payments.id"), nullable=False)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

class WebhookLog(Base):
    __tablename__ = "webhook_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    event = Column(String(50), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(String(20), default="pending")
    attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True) # Used for retry scheduling
    response_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    # Scoped with merchant_id as a composite primary key
    key = Column(String(255), primary_key=True)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), primary_key=True)
    response = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))

# Required Indexes for Task 7.1
Index("idx_refunds_payment_id", Refund.payment_id)
Index("idx_webhook_logs_merchant_id", WebhookLog.merchant_id)
Index("idx_webhook_logs_status", WebhookLog.status)
# Partial index for efficient retry scheduling
Index("idx_webhook_logs_next_retry", WebhookLog.next_retry_at, postgresql_where=(WebhookLog.status == 'pending'))