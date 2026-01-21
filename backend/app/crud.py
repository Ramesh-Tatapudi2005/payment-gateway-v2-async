from sqlalchemy.orm import Session
from . import models

def get_merchant_stats(db: Session, merchant_id: str):
    """
    Calculates real-time data for the dashboard stats-container.
    """
    # Fetch all payments for the specific merchant
    payments = db.query(models.Payment).filter(models.Payment.merchant_id == merchant_id).all()
    
    total_transactions = len(payments)
    
    # Calculate total-amount from the sum of all successful payment amounts
    successful_payments = [p for p in payments if p.status == "success"]
    total_amount = sum(p.amount for p in successful_payments)
    
    # Calculate success-rate as (successful payments / total payments) × 100
    success_rate = 0
    if total_transactions > 0:
        success_rate = (len(successful_payments) / total_transactions) * 100
        
    return {
        "total_transactions": total_transactions,
        "total_amount": total_amount,
        "success_rate": round(success_rate, 2)
    }

def get_all_merchant_payments(db: Session, merchant_id: str):
    """
    Fetches all payments for the transactions-table on the dashboard.
    """
    return db.query(models.Payment).filter(
        models.Payment.merchant_id == merchant_id
    ).order_by(models.Payment.created_at.desc()).all()

def get_merchant_by_api_keys(db: Session, api_key: str, api_secret: str):
    """
    Used by auth.py to validate merchant credentials.
    """
    return db.query(models.Merchant).filter(
        models.Merchant.api_key == api_key,
        models.Merchant.api_secret == api_secret
    ).first()