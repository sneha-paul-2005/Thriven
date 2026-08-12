from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd

from database import get_db
from auth import get_current_user
from routers.metrics import startup_data

router = APIRouter(prefix="/simulation", tags=["simulation"])

class SimulationInput(BaseModel):
    days: int
    signup_rate_delta: float = 0.0     # percent change to daily new signups
    retention_rate_delta: float = 0.0  # percentage point change to retention
    conversion_rate_delta: float = 0.0 # percentage point change to conversion

def _clamp_pct(value: float) -> float:
    return max(0.0, min(100.0, value))

def _baseline_inputs(email: str):
    """Derive avg daily signups, retention rate, conversion rate, and current DAU from real data."""
    if email not in startup_data:
        return None

    df = pd.DataFrame(startup_data[email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    # Average daily new signups
    signup_df = df[df['event'] == 'signup']
    if len(signup_df) > 0:
        daily_signups = signup_df.groupby('date')['user_id'].nunique()
        avg_daily_signups = daily_signups.mean()
    else:
        avg_daily_signups = 0.0

    # Retention rate — same definition as dashboard
    first_visit = df.groupby('user_id')['date'].min()
    returning = df.groupby('user_id')['date'].nunique()
    retained = (returning > 1).sum()
    retention_rate = (retained / len(first_visit) * 100) if len(first_visit) > 0 else 0.0

    # Conversion rate — same definition as dashboard
    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = (purchasers / total_visitors * 100) if total_visitors > 0 else 0.0

    # Current DAU — starting point for projection
    latest_date = df['date'].max()
    current_dau = df[df['date'] == latest_date]['user_id'].nunique()

    return {
        "avg_daily_signups": avg_daily_signups,
        "retention_rate": retention_rate,
        "conversion_rate": conversion_rate,
        "current_dau": current_dau,
    }

def _project(days: int, current_dau: float, avg_daily_signups: float, retention_rate: float, conversion_rate: float):
    """Simple day-by-day projection: DAU = retained users + new signups."""
    projection = []
    dau = current_dau
    retention_fraction = _clamp_pct(retention_rate) / 100

    for day in range(1, days + 1):
        retained = dau * retention_fraction
        dau = retained + avg_daily_signups
        purchases = dau * (_clamp_pct(conversion_rate) / 100)
        projection.append({
            "day": day,
            "dau": round(dau, 1),
            "purchases": round(purchases, 1),
        })

    return projection

@router.post("/run")
def run_simulation(
    payload: SimulationInput,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.days < 1 or payload.days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365.")

    inputs = _baseline_inputs(current_user.email)
    if inputs is None:
        raise HTTPException(status_code=400, detail="Upload a CSV first to run a simulation based on your real data.")

    # Baseline projection — no adjustments
    baseline = _project(
        days=payload.days,
        current_dau=inputs["current_dau"],
        avg_daily_signups=inputs["avg_daily_signups"],
        retention_rate=inputs["retention_rate"],
        conversion_rate=inputs["conversion_rate"],
    )

    # Adjusted projection — apply slider deltas
    adjusted_signups = inputs["avg_daily_signups"] * (1 + payload.signup_rate_delta / 100)
    adjusted_retention = inputs["retention_rate"] + payload.retention_rate_delta
    adjusted_conversion = inputs["conversion_rate"] + payload.conversion_rate_delta

    adjusted = _project(
        days=payload.days,
        current_dau=inputs["current_dau"],
        avg_daily_signups=adjusted_signups,
        retention_rate=adjusted_retention,
        conversion_rate=adjusted_conversion,
    )

    return {
        "baseline": baseline,
        "adjusted": adjusted,
        "inputs_used": {
            "avg_daily_signups": round(inputs["avg_daily_signups"], 1),
            "retention_rate": round(inputs["retention_rate"], 1),
            "conversion_rate": round(inputs["conversion_rate"], 1),
            "current_dau": inputs["current_dau"],
        }
    }