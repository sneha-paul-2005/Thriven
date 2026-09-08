import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import resend
from dotenv import load_dotenv

from database import get_db
from auth import get_current_user
from routers.metrics import get_user_data, _detect_dau_alerts

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

router = APIRouter(prefix="/digest", tags=["digest"])

def _build_digest_data(db: Session, email: str):
    records = get_user_data(db, email)
    if records is None:
        return None

    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()

    thirty_days_ago = latest_date - pd.Timedelta(days=30)
    mau = df[df['date'] >= thirty_days_ago]['user_id'].nunique()

    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = round((purchasers / total_visitors * 100), 1) if total_visitors > 0 else 0.0

    first_visit = df.groupby('user_id')['date'].min()
    returning = df.groupby('user_id')['date'].nunique()
    retained = (returning > 1).sum()
    retention_rate = round((retained / len(first_visit)) * 100, 1) if len(first_visit) > 0 else 0.0

    alerts = _detect_dau_alerts(df, latest_date)

    return {
        "dau": int(dau),
        "mau": int(mau),
        "conversion_rate": conversion_rate,
        "retention_rate": retention_rate,
        "alerts": alerts,
    }

def _render_email_html(startup_name: str, data: dict) -> str:
    alert_severity_colors = {"high": "#dc2626", "medium": "#d97706", "positive": "#16a34a"}

    if data["alerts"]:
        alert_rows = ""
        for alert in data["alerts"]:
            color = alert_severity_colors.get(alert["severity"], "#6b7280")
            alert_rows += f"""
            <tr>
              <td style="padding:8px 0; border-left:3px solid {color}; padding-left:12px;">
                <strong style="color:{color};">{alert['title']}</strong><br/>
                <span style="color:#4b5563; font-size:14px;">{alert['message']}</span>
              </td>
            </tr>
            """
    else:
        alert_rows = '<tr><td style="padding:8px 0; color:#6b7280;">No anomalies detected this week — steady as she goes.</td></tr>'

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <h2 style="color:#f97316;">Thriven Weekly Digest</h2>
      <p style="color:#4b5563;">Here's how <strong>{startup_name}</strong> is doing this week.</p>

      <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding:12px; background:#f9fafb; border-radius:8px;">
            <div style="font-size:13px; color:#6b7280;">Daily Active Users</div>
            <div style="font-size:24px; font-weight:bold;">{data['dau']}</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px; background:#f9fafb; border-radius:8px;">
            <div style="font-size:13px; color:#6b7280;">Monthly Active Users</div>
            <div style="font-size:24px; font-weight:bold;">{data['mau']}</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td style="padding:12px; background:#f9fafb; border-radius:8px;">
            <div style="font-size:13px; color:#6b7280;">Retention Rate</div>
            <div style="font-size:24px; font-weight:bold;">{data['retention_rate']}%</div>
          </td>
          <td style="width:12px;"></td>
          <td style="padding:12px; background:#f9fafb; border-radius:8px;">
            <div style="font-size:13px; color:#6b7280;">Conversion Rate</div>
            <div style="font-size:24px; font-weight:bold;">{data['conversion_rate']}%</div>
          </td>
        </tr>
      </table>

      <h3 style="color:#111827;">This Week's Alerts</h3>
      <table style="width:100%; border-collapse: collapse;">
        {alert_rows}
      </table>

      <p style="color:#9ca3af; font-size:12px; margin-top:32px;">
        This is a test digest sent from your Thriven dashboard.
      </p>
    </div>
    """

@router.post("/send")
def send_digest(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=500, detail="Email service is not configured. Missing RESEND_API_KEY.")

    data = _build_digest_data(db, current_user.email)
    if data is None:
        raise HTTPException(status_code=400, detail="Upload a CSV first to generate a digest with real data.")

    html = _render_email_html(current_user.startup_name or "your startup", data)

    try:
        resend.Emails.send({
            "from": "Thriven <onboarding@resend.dev>",
            "to": [current_user.email],
            "subject": "Your Thriven Weekly Digest",
            "html": html,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return {"message": f"Digest sent to {current_user.email}"}