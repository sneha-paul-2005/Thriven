from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import pandas as pd
import io

router = APIRouter(prefix="/metrics", tags=["metrics"])

# In-memory storage per startup (we'll move to DB later)
startup_data = {}

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

    startup_data[current_user.email] = df.to_dict('records')
    return {"message": "Data uploaded successfully", "rows": len(df)}

@router.get("/dashboard")
def get_dashboard_metrics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.email not in startup_data:
        return {
            "dau": 0,
            "mau": 0,
            "retention_rate": 0,
            "conversion_rate": 0,
            "growth_trend": [],
            "north_star": 0,
            "has_data": False
        }

    df = pd.DataFrame(startup_data[current_user.email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    # DAU — unique users on most recent date
    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()

    # MAU — unique users in last 30 days
    thirty_days_ago = latest_date - pd.Timedelta(days=30)
    mau = df[df['date'] >= thirty_days_ago]['user_id'].nunique()

    # Retention rate — users who came back after day 1
    first_visit = df.groupby('user_id')['date'].min()
    returning = df.groupby('user_id')['date'].nunique()
    retained = (returning > 1).sum()
    retention_rate = round((retained / len(first_visit)) * 100, 1)

    # Conversion rate — users who purchased / total visitors
    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = round((purchasers / total_visitors * 100), 1) if total_visitors > 0 else 0

    # Growth trend — daily active users over time
    daily = df.groupby('date')['user_id'].nunique().reset_index()
    daily.columns = ['date', 'users']
    growth_trend = [
        {"date": str(row['date'].date()), "users": int(row['users'])}
        for _, row in daily.iterrows()
    ]

    # North Star — weekly active users
    seven_days_ago = latest_date - pd.Timedelta(days=7)
    north_star = df[df['date'] >= seven_days_ago]['user_id'].nunique()

    return {
        "dau": int(dau),
        "mau": int(mau),
        "retention_rate": float(retention_rate),
        "conversion_rate": float(conversion_rate),
        "growth_trend": growth_trend,
        "north_star": int(north_star),
        "has_data": True
    }

@router.get("/funnel")
def get_funnel_metrics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.email not in startup_data:
        return {"has_data": False, "stages": []}

    df = pd.DataFrame(startup_data[current_user.email])

    stages = ['visit', 'signup', 'add_to_cart', 'purchase']
    counts = {}
    for stage in stages:
        counts[stage] = df[df['event'] == stage]['user_id'].nunique()

    total = counts['visit'] if counts['visit'] > 0 else 1

    funnel = []
    prev_count = total
    for stage in stages:
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

    return {"has_data": True, "stages": funnel}