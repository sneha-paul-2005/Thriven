from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/profile", tags=["profile"])


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None


def _split_name(full: str):
    parts = (full or "").strip().split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _serialize(user: models.Startup):
    first, last = user.first_name, user.last_name
    if first is None and last is None:
        # Account never edited: derive from the name typed at signup
        first, last = _split_name(user.startup_name)
    first, last = first or "", last or ""
    company = user.company_name or ""
    full = f"{first} {last}".strip()
    return {
        "email": user.email,
        "startup_name": user.startup_name,
        "first_name": first,
        "last_name": last,
        "company_name": company,
        "industry": user.industry or "",
        # What the top bar shows: company name, else full name, else signup name
        "display_name": company or full or user.startup_name,
    }


@router.get("")
def get_profile(user: models.Startup = Depends(get_current_user)):
    return _serialize(user)


@router.put("")
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: models.Startup = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

    for field, value in data.items():
        if value is not None:
            value = value.strip()[:100]
        setattr(user, field, value or None)

    # Keep the public growth page / VC view name in sync with the company name
    if "company_name" in data and user.company_name:
        page = db.query(models.PublicPage).filter(models.PublicPage.user_email == user.email).first()
        if page:
            page.startup_name = user.company_name

    db.commit()
    db.refresh(user)
    return _serialize(user)