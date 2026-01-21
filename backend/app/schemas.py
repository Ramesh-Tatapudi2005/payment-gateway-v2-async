from pydantic import BaseModel, EmailStr, Field, ConfigDict, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# --- Order Schemas ---
class OrderCreate(BaseModel):
    amount: int = Field(..., ge=100) # Minimum 100 paise (₹1.00)
    currency: str = "INR"
    receipt: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None

class OrderResponse(BaseModel):
    id: str
    merchant_id: UUID
    amount: int
    currency: str
    receipt: Optional[str]
    notes: Optional[Dict[str, Any]]
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Payment Schemas ---
class PaymentCreateCard(BaseModel):
    number: str
    expiry_month: int
    expiry_year: int
    cvv: str
    holder_name: str

class PaymentCreate(BaseModel):
    order_id: str
    method: str  # "upi" or "card"
    vpa: Optional[str] = None
    card: Optional[PaymentCreateCard] = None 

class PaymentResponse(BaseModel):
    id: str
    order_id: str
    merchant_id: Any
    amount: int
    currency: str
    method: str
    status: str
    vpa: Optional[str] = None
    card_network: Optional[str] = None
    card_last4: Optional[str] = None
    captured: bool = False # Added: Required for capture logic
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Refund Schemas ---
class RefundCreate(BaseModel):
    amount: int  # Amount in smallest unit (e.g., paise)
    reason: Optional[str] = None

# backend/app/schemas.py

class RefundResponse(BaseModel):
    id: str
    payment_id: str
    amount: int
    reason: Optional[str]
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Webhook Schemas ---
class WebhookLogResponse(BaseModel):
    id: UUID
    event: str
    status: str
    attempts: int
    created_at: datetime
    last_attempt_at: Optional[datetime] = None
    response_code: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class WebhookListResponse(BaseModel):
    data: List[WebhookLogResponse]
    total: int
    limit: int
    offset: int

class WebhookUpdate(BaseModel):
    webhook_url: HttpUrl # Required for the Save Configuration button

# --- Job Status Schema (Mandatory for Evaluation) ---
class JobStatusResponse(BaseModel):
    pending: int
    processing: int
    completed: int = 0
    failed: int = 0
    worker_status: str # "running" or "stopped"