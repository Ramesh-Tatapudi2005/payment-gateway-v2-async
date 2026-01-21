from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from .. import schemas
from .. import auth, models, database
from ..utils.id_generator import generate_custom_id
from ..tasks import process_payment_job, process_refund_job, deliver_webhook_job
from ..worker import celery_app

router = APIRouter()

# UPDATED: Corrected endpoint path and logic for automated evaluation
@router.get("/test/jobs/status", tags=["Evaluation"])
async def get_job_status():
    try:
        inspector = celery_app.control.inspect()
        active = inspector.active() or {}
        reserved = inspector.reserved() or {}
        
        # Calculate totals from all worker nodes
        processing_count = sum(len(tasks) for tasks in active.values())
        pending_count = sum(len(tasks) for tasks in reserved.values())
        
        return {
            "pending": pending_count,
            "processing": processing_count,
            "completed": 0, # Optional per spec
            "failed": 0,
            "worker_status": "running" if active else "stopped"
        }
    except Exception:
        return {
            "pending": 0, "processing": 0, "completed": 0, "failed": 0,
            "worker_status": "stopped"
        }

def get_cached_idempotency_response(db: Session, merchant_id: str, ikey: Optional[str]):
    if not ikey: return None
    record = db.query(models.IdempotencyKey).filter(
        models.IdempotencyKey.key == ikey,
        models.IdempotencyKey.merchant_id == merchant_id
    ).first()
    if record:
        if record.expires_at > datetime.utcnow():
            return record.response
        else:
            db.delete(record)
            db.commit()
    return None

@router.post("/public", status_code=201)
async def create_payment_public(payment_in: schemas.PaymentCreate, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == payment_in.order_id).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    
    payment_id = generate_custom_id("pay_")
    new_payment = models.Payment(
        id=payment_id, order_id=order.id, merchant_id=order.merchant_id,
        amount=order.amount, currency=order.currency, method=payment_in.method,
        status="pending", captured=False
    )
    db.add(new_payment)
    db.commit()
    process_payment_job.delay(payment_id)
    return {"payment_id": payment_id, "status": "pending", "order_id": order.id}

@router.post("", response_model=schemas.PaymentResponse, status_code=201)
async def create_payment(
    payment_in: schemas.PaymentCreate, 
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    cached_res = get_cached_idempotency_response(db, merchant.id, idempotency_key)
    if cached_res: return cached_res
    
    order = db.query(models.Order).filter(
        models.Order.id == payment_in.order_id, 
        models.Order.merchant_id == merchant.id
    ).first()
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    
    payment_id = generate_custom_id("pay_")
    response_data = {
        "id": payment_id, "order_id": order.id, "amount": order.amount,
        "currency": order.currency, "status": "pending", "method": payment_in.method,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    new_payment = models.Payment(
        id=payment_id, order_id=order.id, merchant_id=merchant.id,
        amount=order.amount, currency=order.currency, method=payment_in.method,
        status="pending", captured=False
    )
    db.add(new_payment)
    
    if idempotency_key:
        db.add(models.IdempotencyKey(
            key=idempotency_key, merchant_id=merchant.id, response=response_data,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        ))
    
    db.commit()
    process_payment_job.delay(payment_id)
    deliver_webhook_job.delay(merchant.id, "payment.created", response_data)
    return response_data

@router.post("/{payment_id}/capture")
async def capture_payment(
    payment_id: str, db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id, models.Payment.merchant_id == merchant.id
    ).first()
    if not payment or payment.status != "success":
        raise HTTPException(status_code=400, detail={"error": {"code": "BAD_REQUEST_ERROR", "description": "Payment not in capturable state"}})
    
    payment.captured = True
    db.commit()
    return {
        "id": payment.id, "order_id": payment.order_id, "amount": payment.amount,
        "status": payment.status, "captured": True,
        "created_at": payment.created_at.isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/{payment_id}/refunds", response_model=schemas.RefundResponse, status_code=201)
async def create_refund(
    payment_id: str, refund_in: schemas.RefundCreate,
    db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    payment = db.query(models.Payment).filter(
        models.Payment.id == payment_id, models.Payment.merchant_id == merchant.id
    ).first()
    
    if not payment or payment.status != "success":
        raise HTTPException(status_code=400, detail={"error": {"code": "BAD_REQUEST_ERROR", "description": "Payment not refundable"}})
    
    total_refunded = db.query(func.sum(models.Refund.amount)).filter(models.Refund.payment_id == payment_id).scalar() or 0
    if refund_in.amount > (payment.amount - total_refunded):
        raise HTTPException(status_code=400, detail={"error": {"code": "BAD_REQUEST_ERROR", "description": "Refund amount exceeds available amount"}})
    
    refund_id = generate_custom_id("rfnd_")
    new_refund = models.Refund(
        id=refund_id, payment_id=payment_id, merchant_id=merchant.id,
        amount=refund_in.amount, reason=refund_in.reason, status="pending"
    )
    db.add(new_refund)
    db.commit()
    db.refresh(new_refund) # Reload object state from database
    
    process_refund_job.delay(refund_id)
    
    # FIX: Explicitly validate the database model to Pydantic schema
    return schemas.RefundResponse.model_validate(new_refund)

@router.get("/refunds", response_model=Dict[str, Any])
async def list_refunds(
    limit: int = 10, offset: int = 0,
    db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    query = db.query(models.Refund).filter(models.Refund.merchant_id == merchant.id)
    total = query.count()
    refunds = query.order_by(models.Refund.created_at.desc()).offset(offset).limit(limit).all()
    
    # FIX: Manually cast each list item to solve the Serialization Error
    return {
        "data": [schemas.RefundResponse.model_validate(r) for r in refunds], 
        "total": total, 
        "limit": limit, 
        "offset": offset
    }

@router.get("/refunds/{refund_id}", response_model=schemas.RefundResponse)
async def get_refund(
    refund_id: str, db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    refund = db.query(models.Refund).filter(
        models.Refund.id == refund_id, models.Refund.merchant_id == merchant.id
    ).first()
    if not refund: raise HTTPException(status_code=404, detail="Refund not found")
    return refund

@router.get("/webhooks")
async def list_webhook_logs(
    limit: int = 10, offset: int = 0,
    db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    query = db.query(models.WebhookLog).filter(models.WebhookLog.merchant_id == merchant.id)
    total = query.count()
    logs = query.order_by(models.WebhookLog.created_at.desc()).offset(offset).limit(limit).all()
    return {"data": logs, "total": total, "limit": limit, "offset": offset}

@router.post("/webhooks/{webhook_id}/retry")
async def retry_webhook(
    webhook_id: str, db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    log = db.query(models.WebhookLog).filter(
        models.WebhookLog.id == webhook_id, models.WebhookLog.merchant_id == merchant.id
    ).first()
    if not log: raise HTTPException(status_code=404, detail="Webhook log not found")
    
    log.attempts = 0
    log.status = "pending"
    db.commit()
    deliver_webhook_job.delay(merchant.id, log.event, log.payload)
    return {"id": str(log.id), "status": "pending", "message": "Webhook retry scheduled"}

@router.get("", response_model=List[schemas.PaymentResponse])
def list_payments(db: Session = Depends(database.get_db), merchant: models.Merchant = Depends(auth.get_authenticated_merchant)):
    return db.query(models.Payment).filter(models.Payment.merchant_id == merchant.id).all()