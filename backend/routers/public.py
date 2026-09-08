import secrets
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import PublicPage
from routers.metrics import get_user_data

router = APIRouter(prefix="/public", tags=["public"])


def generate_token(length: int = 12) -> str:
    return secrets.token_urlsafe(length)[:length]


@router.get("/status")
def get_status(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(PublicPage).filter(PublicPage.user_email == current_user.email).first()
    if entry:
        return {"enabled": True, "token": entry.token}
    return {"enabled": False, "token": None}


@router.post("/enable")
def enable_public_page(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(PublicPage).filter(PublicPage.user_email == current_user.email).first()
    if existing:
        return {"token": existing.token}

    token = generate_token()
    while db.query(PublicPage).filter(PublicPage.token == token).first():
        token = generate_token()

    entry = PublicPage(token=token, user_email=current_user.email, startup_name=current_user.startup_name)
    db.add(entry)
    db.commit()

    return {"token": token}


@router.post("/disable")
def disable_public_page(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    entry = db.query(PublicPage).filter(PublicPage.user_email == current_user.email).first()
    if entry:
        db.delete(entry)
        db.commit()
    return {"message": "Public page disabled."}


@router.get("/{token}")
def get_public_page(token: str, db: Session = Depends(get_db)):
    entry = db.query(PublicPage).filter(PublicPage.token == token).first()
    if not entry:
        raise HTTPException(status_code=404, detail="This public page doesn't exist or has been disabled.")

    records = get_user_data(db, entry.user_email)
    if records is None:
        raise HTTPException(status_code=404, detail="No metrics available for this startup yet.")

    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()

    thirty_days_ago = latest_date - pd.Timedelta(days=30)
    mau = df[df['date'] >= thirty_days_ago]['user_id'].nunique()

    daily = df.groupby('date')['user_id'].nunique().reset_index()
    daily.columns = ['date', 'users']
    growth_trend = [
        {"date": str(row['date'].date()), "users": int(row['users'])}
        for _, row in daily.iterrows()
    ]

    return {
        "startup_name": entry.startup_name,
        "dau": int(dau),
        "mau": int(mau),
        "growth_trend": growth_trend,
    }