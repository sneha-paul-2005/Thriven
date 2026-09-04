"""
routers/public.py — Phase 11: Public Growth Page

Lets a logged-in user generate a random, unguessable public link that exposes
a curated snapshot (startup name, DAU, MAU, growth trend) with NO auth required.
Funnel/conversion data is deliberately excluded — competitively sensitive.

In-memory storage, same pattern as startup_data / benchmark_data:
resets on every uvicorn restart. Re-enable after each restart if testing.

NOTE: DAU/MAU/growth_trend calculations below intentionally mirror the logic
in routers/metrics.py -> get_dashboard_metrics(). If you change that formula,
update it here too — metrics.py doesn't expose it as a shared helper.
"""

import secrets
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from routers.metrics import startup_data

router = APIRouter(prefix="/public", tags=["public"])

# token -> { "email": str, "startup_name": str }
public_pages: dict[str, dict] = {}

# email -> token
email_to_token: dict[str, str] = {}


def generate_token(length: int = 12) -> str:
    return secrets.token_urlsafe(length)[:length]


@router.get("/status")
def get_status(current_user=Depends(get_current_user)):
    email = current_user.email
    token = email_to_token.get(email)

    if token and token in public_pages:
        return {"enabled": True, "token": token}

    return {"enabled": False, "token": None}


@router.post("/enable")
def enable_public_page(current_user=Depends(get_current_user)):
    email = current_user.email

    existing_token = email_to_token.get(email)
    if existing_token and existing_token in public_pages:
        return {"token": existing_token}

    token = generate_token()
    while token in public_pages:
        token = generate_token()

    public_pages[token] = {
        "email": email,
        "startup_name": current_user.startup_name,
    }
    email_to_token[email] = token

    return {"token": token}


@router.post("/disable")
def disable_public_page(current_user=Depends(get_current_user)):
    email = current_user.email
    token = email_to_token.pop(email, None)

    if token:
        public_pages.pop(token, None)

    return {"message": "Public page disabled."}


@router.get("/{token}")
def get_public_page(token: str):
    """
    Public, no-auth endpoint. Returns a curated snapshot only:
    startup_name, dau, mau, growth_trend. No funnel/conversion data.
    """
    entry = public_pages.get(token)
    if not entry:
        raise HTTPException(status_code=404, detail="This public page doesn't exist or has been disabled.")

    email = entry["email"]
    if email not in startup_data:
        raise HTTPException(status_code=404, detail="No metrics available for this startup yet.")

    df = pd.DataFrame(startup_data[email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    latest_date = df['date'].max()

    # DAU — unique users on most recent date
    dau = df[df['date'] == latest_date]['user_id'].nunique()

    # MAU — unique users in last 30 days
    thirty_days_ago = latest_date - pd.Timedelta(days=30)
    mau = df[df['date'] >= thirty_days_ago]['user_id'].nunique()

    # Growth trend — daily active users over time
    daily = df.groupby('date')['user_id'].nunique().reset_index()
    daily.columns = ['date', 'users']
    growth_trend = [
        {"date": str(row['date'].date()), "users": int(row['users'])}
        for _, row in daily.iterrows()
    ]

    return {
        "startup_name": entry["startup_name"],
        "dau": int(dau),
        "mau": int(mau),
        "growth_trend": growth_trend,
    }