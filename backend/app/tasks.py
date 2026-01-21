import os
import time
import random
import json
import hmac
import hashlib
import requests
from datetime import datetime, timedelta
from .worker import celery_app
from .database import SessionLocal
from . import models

def generate_webhook_signature(payload_dict, secret):
    payload_string = json.dumps(payload_dict, separators=(',', ':'))
    return hmac.new(
        secret.encode(),
        payload_string.encode(),
        hashlib.sha256
    ).hexdigest()

@celery_app.task(name="app.tasks.process_payment")
def process_payment_job(payment_id: str):
    db = SessionLocal()
    try:
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if not payment:
            return

        test_mode = os.getenv("TEST_MODE", "false").lower() == "true"
        if test_mode:
            delay = int(os.getenv("TEST_PROCESSING_DELAY", 1000)) / 1000.0
        else:
            delay = random.randint(5, 10)
        time.sleep(delay)

        if test_mode:
            success = os.getenv("TEST_PAYMENT_SUCCESS", "true").lower() == "true"
        else:
            threshold = 0.90 if payment.method == "upi" else 0.95
            success = random.random() < threshold

        payment.status = "success" if success else "failed"
        if not success:
            payment.error_code = "BANK_DECLINED"
            payment.error_description = "The transaction was rejected by the bank."
        
        db.commit()

        event = "payment.success" if success else "payment.failed"
        webhook_payload = {
            "event": event,
            "timestamp": int(time.time()),
            "data": {
                "payment": {
                    "id": payment.id,
                    "order_id": payment.order_id,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "method": payment.method,
                    "status": payment.status,
                    "created_at": payment.created_at.isoformat() + "Z"
                }
            }
        }
        deliver_webhook_job.delay(payment.merchant_id, event, webhook_payload)

    finally:
        db.close()

@celery_app.task(name="app.tasks.deliver_webhook", bind=True)
def deliver_webhook_job(self, merchant_id: str, event: str, payload: dict, attempt: int = 1):
    db = SessionLocal()
    try:
        merchant = db.query(models.Merchant).filter(models.Merchant.id == merchant_id).first()
        if not merchant or not merchant.webhook_url:
            return

        signature = generate_webhook_signature(payload, merchant.webhook_secret or "whsec_test_abc123")
        
        log = models.WebhookLog(
            merchant_id=merchant.id,
            event=event,
            payload=payload,
            attempts=attempt,
            status="pending"
        )
        db.add(log)
        db.commit()

        try:
            response = requests.post(
                merchant.webhook_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Webhook-Signature": signature
                },
                timeout=5
            )
            
            log.response_code = response.status_code
            log.response_body = response.text[:500]
            log.last_attempt_at = datetime.utcnow()

            if 200 <= response.status_code < 300:
                log.status = "success"
                db.commit()
            else:
                raise Exception(f"Status {response.status_code}")

        except Exception:
            log.status = "pending"
            if attempt < 5:
                test_retries = os.getenv("WEBHOOK_RETRY_INTERVALS_TEST", "false").lower() == "true"
                intervals = [0, 5, 10, 15, 20] if test_retries else [0, 60, 300, 1800, 7200]
                
                next_delay = intervals[attempt]
                log.next_retry_at = datetime.utcnow() + timedelta(seconds=next_delay)
                db.commit()
                
                self.retry(args=[merchant_id, event, payload, attempt + 1], countdown=next_delay)
            else:
                log.status = "failed"
                db.commit()
    finally:
        db.close()

@celery_app.task(name="app.tasks.process_refund")
def process_refund_job(refund_id: str):
    db = SessionLocal()
    try:
        # 1. Fetch refund record
        refund = db.query(models.Refund).filter(models.Refund.id == refund_id).first()
        if not refund:
            return

        # 2. Verify payment state: Must be 'success' to be refundable
        payment = db.query(models.Payment).filter(models.Payment.id == refund.payment_id).first()
        if not payment or payment.status != "success":
            refund.status = "failed"
            db.commit()
            return

        # 3. Simulate refund processing delay (3-5 seconds)
        time.sleep(random.randint(3, 5))

        # 4. Update refund status and timestamps
        refund.status = "processed"
        refund.processed_at = datetime.utcnow()
        
        # 5. Calculate total refunded to handle partial/full refund logic
        all_processed_refunds = db.query(models.Refund).filter(
            models.Refund.payment_id == payment.id,
            models.Refund.status == "processed"
        ).all()
        total_refunded = sum(r.amount for r in all_processed_refunds)

        # 6. Update payment record if fully refunded
        if total_refunded >= payment.amount:
            payment.status = "refunded"
            
        db.commit()

        # 7. Enqueue webhook delivery for 'refund.processed' event
        webhook_payload = {
            "event": "refund.processed",
            "timestamp": int(time.time()),
            "data": {
                "refund": {
                    "id": refund.id,
                    "payment_id": refund.payment_id,
                    "amount": refund.amount,
                    "status": refund.status,
                    "processed_at": refund.processed_at.isoformat() + "Z"
                }
            }
        }
        deliver_webhook_job.delay(refund.merchant_id, "refund.processed", webhook_payload)
    finally:
        db.close()