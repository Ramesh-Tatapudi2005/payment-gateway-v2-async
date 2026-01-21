from fastapi import Header, HTTPException, Depends, APIRouter
from sqlalchemy.orm import Session
from .database import get_db
from .models import Merchant
from pydantic import BaseModel

# 1. Initialize the router (This line solves the AttributeError)
router = APIRouter()

# 2. Define a schema for the login request
class LoginRequest(BaseModel):
    email: str
    api_key: str

# 3. Add a login route so your frontend "Sign In" button works
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    merchant = db.query(Merchant).filter(
        Merchant.email == payload.email,
        Merchant.api_key == payload.api_key
    ).first()

    if not merchant:
        raise HTTPException(status_code=401, detail="Invalid email or API key")
    
    return {
        "id": str(merchant.id),
        "name": merchant.name,
        "email": merchant.email,
        "api_key": merchant.api_key
    }

async def get_authenticated_merchant(
    x_api_key: str = Header(None, alias="X-Api-Key"),
    x_api_secret: str = Header(None, alias="X-Api-Secret"),
    db: Session = Depends(get_db)
):
    if not x_api_key or not x_api_secret:
        raise HTTPException(status_code=401, detail={
            "error": {"code": "AUTHENTICATION_ERROR", "description": "Invalid API credentials"}
        })
    
    merchant = db.query(Merchant).filter(
        Merchant.api_key == x_api_key, 
        Merchant.api_secret == x_api_secret
    ).first()
    
    if not merchant:
        raise HTTPException(status_code=401, detail={
            "error": {"code": "AUTHENTICATION_ERROR", "description": "Invalid API credentials"}
        })
    return merchant