from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from models import MetricsUpload
import pandas as pd
import io

router = APIRouter(prefix="/metrics", tags=["metrics"])

FUNNEL_STAGES = ['visit', 'signup', 'add_to_cart', 'purchase']


def get_user_data(db: Session, email: str):
    """Returns a user's uploaded CSV rows as a list of dicts, or None if nothing uploaded yet."""
    record = db.query(MetricsUpload).filter(MetricsUpload.user_email == email).first()
    return record.row_data if record else None


def set_user_data(db: Session, email: str, records: list):
    """Upsert a user's uploaded CSV rows — replaces any previous upload."""
    existing = db.query(MetricsUpload).filter(MetricsUpload.user_email == email).first()
    if existing:
        existing.row_data = records
    else:
        db.add(MetricsUpload(user_email=email, row_data=records))
    db.commit()


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8-sig')))

    required_columns = ['user_id', 'date', 'event']
    for col in required_columns:
        if col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required column: {col}"
            )

    set_user_data(db, current_user.email, df.to_dict('records'))
    return {"message": "Data uploaded successfully", "rows": len(df)}


def _detect_dau_alerts(df: pd.DataFrame, latest_date):
    """Compare today's DAU to yesterday, and to the trailing 7-day average."""
    alerts = []

    daily_users = df.groupby('date')['user_id'].nunique()

    today_dau = int(daily_users.get(latest_date, 0))

    yesterday = latest_date - pd.Timedelta(days=1)
    if yesterday in daily_users.index:
        yesterday_dau = int(daily_users[yesterday])
        if yesterday_dau > 0:
            change = round(((today_dau - yesterday_dau) / yesterday_dau) * 100, 1)
            if change <= -30:
                alerts.append({
                    "severity": "high",
                    "title": "DAU dropped sharply vs yesterday",
                    "message": f"Daily active users fell {abs(change)}% compared to yesterday ({yesterday_dau} → {today_dau})."
                })
            elif change <= -15:
                alerts.append({
                    "severity": "medium",
                    "title": "DAU down vs yesterday",
                    "message": f"Daily active users are down {abs(change)}% compared to yesterday ({yesterday_dau} → {today_dau})."
                })
            elif change >= 20:
                alerts.append({
                    "severity": "positive",
                    "title": "DAU surge vs yesterday",
                    "message": f"Daily active users are up {change}% compared to yesterday ({yesterday_dau} → {today_dau})."
                })

    seven_days_ago = latest_date - pd.Timedelta(days=7)
    trailing_window = daily_users[(daily_users.index >= seven_days_ago) & (daily_users.index < latest_date)]
    if len(trailing_window) > 0:
        avg_dau = trailing_window.mean()
        if avg_dau > 0:
            change = round(((today_dau - avg_dau) / avg_dau) * 100, 1)
            if change <= -30:
                alerts.append({
                    "severity": "high",
                    "title": "DAU well below recent average",
                    "message": f"Today's DAU ({today_dau}) is {abs(change)}% below the last 7-day average ({avg_dau:.1f})."
                })
            elif change <= -15:
                alerts.append({
                    "severity": "medium",
                    "title": "DAU trending below average",
                    "message": f"Today's DAU ({today_dau}) is {abs(change)}% below the last 7-day average ({avg_dau:.1f})."
                })
            elif change >= 20:
                alerts.append({
                    "severity": "positive",
                    "title": "DAU trending above average",
                    "message": f"Today's DAU ({today_dau}) is {change}% above the last 7-day average ({avg_dau:.1f})."
                })

    return alerts


@router.get("/dashboard")
def get_dashboard_metrics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = get_user_data(db, current_user.email)
    if records is None:
        return {
            "dau": 0,
            "mau": 0,
            "retention_rate": 0,
            "conversion_rate": 0,
            "growth_trend": [],
            "event_breakdown": [],
            "alerts": [],
            "north_star": 0,
            "has_data": False
        }

    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()

    thirty_days_ago = latest_date - pd.Timedelta(days=30)
    mau = df[df['date'] >= thirty_days_ago]['user_id'].nunique()

    first_visit = df.groupby('user_id')['date'].min()
    returning = df.groupby('user_id')['date'].nunique()
    retained = (returning > 1).sum()
    retention_rate = round((retained / len(first_visit)) * 100, 1)

    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = round((purchasers / total_visitors * 100), 1) if total_visitors > 0 else 0

    daily = df.groupby('date')['user_id'].nunique().reset_index()
    daily.columns = ['date', 'users']
    growth_trend = [
        {"date": str(row['date'].date()), "users": int(row['users'])}
        for _, row in daily.iterrows()
    ]

    seven_days_ago = latest_date - pd.Timedelta(days=7)
    north_star = df[df['date'] >= seven_days_ago]['user_id'].nunique()

    event_breakdown = []
    for date, group in df.groupby('date'):
        event_breakdown.append({
            "date": str(date.date())[5:],
            "visits": int((group['event'] == 'visit').sum()),
            "signups": int((group['event'] == 'signup').sum()),
            "purchases": int((group['event'] == 'purchase').sum()),
        })

    alerts = _detect_dau_alerts(df, latest_date)

    return {
        "dau": int(dau),
        "mau": int(mau),
        "retention_rate": float(retention_rate),
        "conversion_rate": float(conversion_rate),
        "growth_trend": growth_trend,
        "event_breakdown": event_breakdown,
        "alerts": alerts,
        "north_star": int(north_star),
        "has_data": True
    }


def _funnel_dropoffs(group: pd.DataFrame):
    counts = {stage: group[group['event'] == stage]['user_id'].nunique() for stage in FUNNEL_STAGES}
    dropoffs = []
    prev_count = counts[FUNNEL_STAGES[0]]
    for stage in FUNNEL_STAGES[1:]:
        count = counts[stage]
        dropoff = round(((prev_count - count) / prev_count) * 100, 1) if prev_count > 0 else 0.0
        dropoffs.append((stage, dropoff))
        prev_count = count
    return dropoffs


def _segment_conversion(df: pd.DataFrame, column: str):
    if column not in df.columns:
        return []

    results = []
    for value, group in df.groupby(column):
        visitors = group[group['event'] == 'visit']['user_id'].nunique()
        purchasers = group[group['event'] == 'purchase']['user_id'].nunique()
        rate = round((purchasers / visitors * 100), 1) if visitors > 0 else 0.0

        dropoffs = _funnel_dropoffs(group)
        worst_stage, worst_dropoff = max(dropoffs, key=lambda d: d[1]) if dropoffs else (None, None)

        results.append({
            "label": str(value),
            "conversion_rate": rate,
            "worst_stage": worst_stage.replace('_', ' ').title() if worst_stage else None,
            "worst_dropoff": worst_dropoff,
        })

    results.sort(key=lambda r: r['conversion_rate'], reverse=True)
    return results


@router.get("/funnel")
def get_funnel_metrics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = get_user_data(db, current_user.email)
    if records is None:
        return {"has_data": False, "stages": [], "segments": {}}

    df = pd.DataFrame(records)

    counts = {}
    for stage in FUNNEL_STAGES:
        counts[stage] = df[df['event'] == stage]['user_id'].nunique()

    total = counts['visit'] if counts['visit'] > 0 else 1

    funnel = []
    prev_count = total
    for stage in FUNNEL_STAGES:
        count = counts[stage]
        percentage = round((count / total) * 100, 1)
        dropoff = round(((prev_count - count) / prev_count) * 100, 1) if prev_count > 0 else 0
        funnel.append({
            "stage": stage.replace('_', ' ').title(),
            "count": count,
            "percentage": percentage,
            "dropoff": dropoff
        })
        prev_count = count

    segments = {
        "device": _segment_conversion(df, 'device'),
        "location": _segment_conversion(df, 'location'),
        "traffic_source": _segment_conversion(df, 'traffic_source'),
    }

    return {"has_data": True, "stages": funnel, "segments": segments}