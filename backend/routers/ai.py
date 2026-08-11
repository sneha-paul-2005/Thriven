import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

from database import get_db
from auth import get_current_user
from routers.metrics import startup_data

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatTurn]] = []

def _build_context_summary(email: str) -> str:
    """Summarize the user's real metrics as plain text context for the model."""
    if email not in startup_data:
        return "The user has not uploaded any data yet. Answer generally, and suggest they upload a CSV from the Dashboard for personalized insights."

    import pandas as pd
    df = pd.DataFrame(startup_data[email])
    df['date'] = pd.to_datetime(df['date'], dayfirst=True)

    total_visitors = df[df['event'] == 'visit']['user_id'].nunique()
    purchasers = df[df['event'] == 'purchase']['user_id'].nunique()
    conversion_rate = round((purchasers / total_visitors * 100), 1) if total_visitors > 0 else 0

    latest_date = df['date'].max()
    dau = df[df['date'] == latest_date]['user_id'].nunique()
    mau = df[df['date'] >= latest_date - pd.Timedelta(days=30)]['user_id'].nunique()

    stages = ['visit', 'signup', 'add_to_cart', 'purchase']
    counts = {s: df[df['event'] == s]['user_id'].nunique() for s in stages}

    summary = (
        f"Here is the startup's real data summary:\n"
        f"- Daily Active Users (DAU): {dau}\n"
        f"- Monthly Active Users (MAU): {mau}\n"
        f"- Overall conversion rate (visit to purchase): {conversion_rate}%\n"
        f"- Funnel counts: Visit={counts['visit']}, Signup={counts['signup']}, "
        f"Add to Cart={counts['add_to_cart']}, Purchase={counts['purchase']}\n"
    )

    if 'device' in df.columns:
        device_counts = df.groupby('device')['user_id'].nunique().to_dict()
        summary += f"- Users by device: {device_counts}\n"
    if 'location' in df.columns:
        location_counts = df.groupby('location')['user_id'].nunique().to_dict()
        summary += f"- Users by location: {location_counts}\n"
    if 'traffic_source' in df.columns:
        traffic_counts = df.groupby('traffic_source')['user_id'].nunique().to_dict()
        summary += f"- Users by traffic source: {traffic_counts}\n"

    return summary

@router.post("/chat")
def chat(
    request: ChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="AI assistant is not configured. Missing GEMINI_API_KEY.")

    context = _build_context_summary(current_user.email)

    system_prompt = (
        "Your name is Troy. You are Thriven's AI growth assistant, helping a startup founder "
        "understand their product analytics and improve growth metrics. Always refer to yourself "
        "as Troy. If asked what model, AI system, or company is behind you, say only that you're "
        "Troy, Thriven's built-in growth assistant — do not mention Gemini, Google, or any "
        "underlying model or provider by name.\n\n"
        "Be concise, practical, and specific. When the user's real data is available, ground your "
        "answer in it and reference actual numbers. When it isn't available, answer generally and "
        "suggest uploading data.\n\n"
        f"{context}"
    )

    try:
        # Convert prior turns into the SDK's expected chat history format
        gemini_history = []
        for turn in request.history:
            role = "user" if turn.role == "user" else "model"
            gemini_history.append(types.Content(role=role, parts=[types.Part(text=turn.content)]))

        chat_session = client.chats.create(
            model="gemini-flash-latest",
            history=gemini_history,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )

        response = chat_session.send_message(message=request.message)

        return {"reply": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")