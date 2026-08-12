import random
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd

from database import get_db
from auth import get_current_user
from routers.metrics import startup_data

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

# In-memory storage per startup (same pattern as metrics.py)
benchmark_data = {}

DAILY_DRIFT_RANGE = 0.3   # small daily nudge, +/- percentage points
WEEKLY_DRIFT_RANGE = 1.5  # bigger nudge every 7 days, +/- percentage points

class BaselineInput(BaseModel):
    conversion_rate: float
    retention_rate: float
    dau_mau_ratio: float

def _clamp(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)

def _compute_user_metrics(email: str):
    """Real conversion rate, retention rate, and DAU/MAU ratio from uploaded CSV."""
    if email not in startup_data:
        return None

    df = pd.DataFrame(startup_data[email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = round((purchasers / total_visitors * 100), 1) if total_visitors > 0 else 0.0

    first_visit = df.groupby('user_id')['date'].min()
    returning = df.groupby('user_id')['date'].nunique()
    retained = (returning > 1).sum()
    retention_rate = round((retained / len(first_visit)) * 100, 1) if len(first_visit) > 0 else 0.0

    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()
    mau = df[df['date'] >= latest_date - pd.Timedelta(days=30)]['user_id'].nunique()
    dau_mau_ratio = round((dau / mau * 100), 1) if mau > 0 else 0.0

    return {
        "conversion_rate": conversion_rate,
        "retention_rate": retention_rate,
        "dau_mau_ratio": dau_mau_ratio,
    }

def _apply_drift(email: str):
    """Catch up the benchmark's drift for every day missed since it was last updated."""
    entry = benchmark_data[email]
    today = date.today()
    last_date = entry["last_drift_date"]

    days_passed = (today - last_date).days
    if days_passed <= 0:
        return  # already up to date

    for offset in range(1, days_passed + 1):
        drift_date = last_date + timedelta(days=offset)
        entry["day_count"] += 1

        for key in ["conversion_rate", "retention_rate", "dau_mau_ratio"]:
            nudge = random.uniform(-DAILY_DRIFT_RANGE, DAILY_DRIFT_RANGE)

            # Bigger weekly shift every 7 days since baseline was set
            if entry["day_count"] % 7 == 0:
                nudge += random.uniform(-WEEKLY_DRIFT_RANGE, WEEKLY_DRIFT_RANGE)

            entry["current"][key] = _clamp(entry["current"][key] + nudge)

        entry["history"].append({
            "date": str(drift_date)[5:],  # MM-DD
            **entry["current"]
        })

    entry["last_drift_date"] = today

def _compute_drift_deltas(history: list) -> dict:
    """For each metric, compute change since yesterday and since ~7 days ago."""
    deltas = {}
    metrics = ["conversion_rate", "retention_rate", "dau_mau_ratio"]

    if not history:
        return {m: {"since_yesterday": None, "since_week": None} for m in metrics}

    latest = history[-1]

    yesterday = history[-2] if len(history) >= 2 else None
    week_ago = history[-8] if len(history) >= 8 else history[0]

    for m in metrics:
        deltas[m] = {
            "since_yesterday": round(latest[m] - yesterday[m], 1) if yesterday else None,
            "since_week": round(latest[m] - week_ago[m], 1) if week_ago else None,
        }

    return deltas


@router.get("")
def get_benchmark(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email = current_user.email

    if email not in benchmark_data:
        return {"has_benchmark": False}

    _apply_drift(email)
    entry = benchmark_data[email]

    your_metrics = _compute_user_metrics(email) or {
        "conversion_rate": 0.0,
        "retention_rate": 0.0,
        "dau_mau_ratio": 0.0,
    }

    trimmed_history = entry["history"][-30:]

    return {
        "has_benchmark": True,
        "your_metrics": your_metrics,
        "current": entry["current"],
        "history": trimmed_history,
        "drift": _compute_drift_deltas(trimmed_history),
    }

@router.post("/set")
def set_benchmark(
    baseline: BaselineInput,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    email = current_user.email
    today = date.today()

    baseline_values = {
        "conversion_rate": _clamp(baseline.conversion_rate),
        "retention_rate": _clamp(baseline.retention_rate),
        "dau_mau_ratio": _clamp(baseline.dau_mau_ratio),
    }

    benchmark_data[email] = {
        "baseline": baseline_values,
        "current": dict(baseline_values),
        "last_drift_date": today,
        "day_count": 0,
        "history": [{
            "date": str(today)[5:],
            **baseline_values
        }],
    }

    return {"message": "Baseline set successfully"}
