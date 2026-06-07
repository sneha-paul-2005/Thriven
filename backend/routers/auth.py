from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
import auth

router = APIRouter(prefix="/auth", tags=["auth"])

class SignupRequest(BaseModel):
    startup_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(models.Startup).filter(
        models.Startup.email == req.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check if startup name already exists
    existing_name = db.query(models.Startup).filter(
        models.Startup.startup_name == req.startup_name
    ).first()
    if existing_name:
        raise HTTPException(
            status_code=400,
            detail="Startup name already taken"
        )

    # Create new startup
    hashed = auth.hash_password(req.password)
    new_startup = models.Startup(
        startup_name=req.startup_name,
        email=req.email,
        hashed_password=hashed
    )
    db.add(new_startup)
    db.commit()
    db.refresh(new_startup)

    token = auth.create_access_token({"sub": new_startup.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "startup_name": new_startup.startup_name
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Startup).filter(
        models.Startup.email == req.email
    ).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = auth.create_access_token({"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "startup_name": user.startup_name
    }

@router.get("/me")
def get_me(current_user = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "startup_name": current_user.startup_name,
        "email": current_user.email
    }