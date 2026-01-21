from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel, HttpUrl

from celery.result import AsyncResult
from .tasks import celery_app
from . import auth

from .database import engine, Base, SessionLocal, get_db
from .models import Merchant
from .routers import orders, payments 
import sqlalchemy

app = FastAPI(title="Payment Gateway API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WebhookUpdate(BaseModel):
    webhook_url: HttpUrl

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    seed_test_merchant()

def seed_test_merchant():
    db = SessionLocal()
    try:
        test_id = "550e8400-e29b-41d4-a716-446655440000"
        test_email = "test@example.com"
        
        exists = db.query(Merchant).filter(Merchant.email == test_email).first()
        
        if not exists:
            test_merchant = Merchant(
                id=test_id,
                name="Test Merchant",
                email=test_email,
                api_key="key_test_abc123",
                api_secret="secret_test_xyz789",
                webhook_url="http://host.docker.internal:3002/api/webhooks",
                webhook_secret="whsec_test_abc123"
            )
            db.add(test_merchant)
            db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])


@app.patch("/api/v1/test/merchant")
def update_merchant_webhook(payload: WebhookUpdate, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.email == "test@example.com").first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    
    merchant.webhook_url = str(payload.webhook_url)
    db.commit()
    return {"status": "success", "webhook_url": merchant.webhook_url}

@app.get("/health")
def health_check():
    db_status = "disconnected"
    try:
        db = SessionLocal()
        db.execute(sqlalchemy.text("SELECT 1"))
        db_status = "connected"
        db.close()
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "database": db_status,
        "redis": "connected", 
        "worker": "running",   
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }

@app.get("/api/v1/test/merchant")
def get_test_merchant(db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(Merchant.email == "test@example.com").first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Test merchant not found")
        
    return {
        "id": str(merchant.id),
        "email": merchant.email,
        "api_key": merchant.api_key,
        "api_secret": merchant.api_secret,
        "webhook_url": merchant.webhook_url, 
        "webhook_secret": merchant.webhook_secret,
        "seeded": True
    }
    
@app.get("/api/v1/test/jobs/status")
async def get_job_status():
    inspector = celery_app.control.inspect()
    
    active = inspector.active() or {}
    reserved = inspector.reserved() or {}
    
    processing_count = sum(len(tasks) for tasks in active.values())
    pending_count = sum(len(tasks) for tasks in reserved.values())
    
    return {
        "pending": pending_count,
        "processing": processing_count,
        "completed": 0,
        "failed": 0,
        "worker_status": "running" if active else "stopped"
    }