from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth
from .. import models, schemas, database
from ..utils.id_generator import generate_custom_id

# Create the router
router = APIRouter()

# Change the path to "" so it matches the prefix exactly
@router.post("", response_model=schemas.OrderResponse, status_code=201)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(database.get_db),
    merchant: models.Merchant = Depends(auth.get_authenticated_merchant)
):
    # Your order logic here...
    new_order = models.Order(
        id=generate_custom_id("order_"),
        merchant_id=merchant.id,
        amount=order_in.amount,
        currency=order_in.currency,
        receipt=order_in.receipt,
        status="created"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# GET single order
@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(order_id: str, db: Session = Depends(database.get_db), merchant: models.Merchant = Depends(auth.get_authenticated_merchant)):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.merchant_id == merchant.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# GET all orders
@router.get("", response_model=list[schemas.OrderResponse])
def list_orders(db: Session = Depends(database.get_db), merchant: models.Merchant = Depends(auth.get_authenticated_merchant)):
    return db.query(models.Order).filter(models.Order.merchant_id == merchant.id).all()


@router.get("/{order_id}/public")
def get_order_public(order_id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail={"error": {"code": "NOT_FOUND_ERROR", "description": "Order not found"}})
    # Return only basic info
    return {
        "id": order.id,
        "amount": order.amount,
        "currency": order.currency,
        "status": order.status
    }