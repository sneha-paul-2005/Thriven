from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db
from auth import get_current_user
from routers.metrics import startup_data

router = APIRouter(prefix="/cohorts", tags=["cohorts"])

MAX_PERIODS = 6  # cap columns shown, keeps the grid readable

def _build_cohort_grid(df: pd.DataFrame, granularity: str):
    freq = "W" if granularity == "weekly" else "M"

    # Assign each user to a cohort based on their first-ever activity date
    first_activity = df.groupby('user_id')['date'].min().reset_index()
    first_activity['cohort_period'] = first_activity['date'].dt.to_period(freq)

    # Merge cohort assignment back onto the full event log
    merged = df.merge(first_activity[['user_id', 'cohort_period']], on='user_id')
    merged['activity_period'] = merged['date'].dt.to_period(freq)

    cohorts = sorted(first_activity['cohort_period'].unique())
    if len(cohorts) == 0:
        return [], []

    num_periods = min(MAX_PERIODS, len(cohorts))
    period_labels = [f"+{i}" if i > 0 else "Week 0" if granularity == "weekly" else "Month 0" for i in range(num_periods)]

    rows = []
    for cohort in cohorts:
        cohort_users = first_activity[first_activity['cohort_period'] == cohort]['user_id']
        cohort_size = len(cohort_users)
        if cohort_size == 0:
            continue

        cohort_events = merged[merged['cohort_period'] == cohort]

        retention = []
        for offset in range(num_periods):
            target_period = cohort + offset
            active_users = cohort_events[cohort_events['activity_period'] == target_period]['user_id'].nunique()

            # If the target period is still in the future relative to the data we have, show null
            latest_available_period = df['date'].max().to_period(freq)
            if target_period > latest_available_period:
                retention.append(None)
            else:
                pct = round((active_users / cohort_size) * 100, 1) if cohort_size > 0 else 0.0
                retention.append(pct)

        cohort_label = str(cohort.start_time.date()) if granularity == "monthly" else f"Week of {cohort.start_time.date()}"
        rows.append({
            "cohort_label": cohort_label,
            "cohort_size": cohort_size,
            "retention": retention,
        })

    return rows, period_labels

@router.get("")
def get_cohorts(
    granularity: str = Query("weekly", pattern="^(weekly|monthly)$"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.email not in startup_data:
        return {"has_data": False, "cohorts": [], "period_labels": []}

    df = pd.DataFrame(startup_data[current_user.email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    rows, period_labels = _build_cohort_grid(df, granularity)

    return {
        "has_data": True,
        "cohorts": rows,
        "period_labels": period_labels,
    }